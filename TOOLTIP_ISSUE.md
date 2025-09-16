# ECharts Tooltip 不显示问题 - Vue Ref vs 普通变量

## 问题描述

在 Vue 3 + ECharts 项目中，当使用 Vue 的 `ref()` 来存储 ECharts 实例时，图表的 tooltip 无法正常显示。但使用普通变量存储 ECharts 实例时，tooltip 可以正常工作。

## 环境信息

- **Vue 版本**: 3.5.21
- **ECharts 版本**: 6.0.0
- **TypeScript 版本**: 5.9.2
- **构建工具**: Vite 7.1.5

## 复现步骤

### 方法一：使用普通变量（tooltip 正常工作）

```typescript
let chartInstance: null | echarts.ECharts = null
const chartDom = ref()

async function renderChart() {
  if (!chartInstance) {
    chartInstance = echarts.init(chartDom.value)
  }
  chartInstance.setOption(option)
}
```

### 方法二：使用 Vue ref（tooltip 不工作）

```typescript
const chartInstanceVueRef = ref()
const chartDomUseRef = ref()

async function renderChartUseRef() {
  if (!chartInstanceVueRef.value) {
    chartInstanceVueRef.value = echarts.init(chartDomUseRef.value)
  }
  chartInstanceVueRef.value.setOption(option)
}
```

## 图表配置

```typescript
const option = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
  },
  xAxis: [
    {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisTick: {
        alignWithLabel: true
      }
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [
    {
      name: 'Direct',
      type: 'bar',
      barWidth: '60%',
      data: [10, 52, 200, 334, 390, 330, 220]
    }
  ]
}
```

## 预期行为

两种方法都应该能够正常显示 tooltip，当鼠标悬停在图表上时应该显示相应的数据信息。

## 实际行为

- **方法一（普通变量）**: tooltip 正常显示 ✅
- **方法二（Vue ref）**: tooltip 不显示 ❌

## 可能的原因分析

1. **Vue 响应式系统干扰**: Vue 的 ref 会将对象包装成响应式代理，可能影响 ECharts 内部的事件绑定机制
2. **事件监听器绑定问题**: ECharts 的 tooltip 依赖于 DOM 事件，响应式代理可能影响事件监听器的正确绑定
3. **实例引用问题**: 通过 ref 访问的 ECharts 实例可能与原始实例存在差异

## 临时解决方案

目前使用普通变量而非 Vue ref 来存储 ECharts 实例可以避免此问题。

## 完整代码示例

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const option = {
  // ... 配置如上
}

let chartInstance: null | echarts.ECharts = null
const chartInstanceVueRef = ref()
const chartDom = ref()
const chartDomUseRef = ref()

// 正常工作的方法
async function renderChart() {
  if (!chartInstance) {
    chartInstance = echarts.init(chartDom.value)
  }
  chartInstance.setOption(option)
}

// tooltip 不工作的方法
async function renderChartUseRef() {
  if (!chartInstanceVueRef.value) {
    chartInstanceVueRef.value = echarts.init(chartDomUseRef.value)
  }
  chartInstanceVueRef.value.setOption(option)
}

onMounted(() => {
  renderChart()
  renderChartUseRef()
})
</script>

<template>
  <div class="chart-container" style="border-color: green;">
    不使用 ref 接收变量
    <div ref="chartDom" />
  </div>
  <div class="chart-container" style="border-color: red;">
    使用 ref 接收变量
    <div ref="chartDomUseRef" />
  </div>
</template>
```

## 期望的解决方案

希望能够找到一种方法，使得使用 Vue ref 存储 ECharts 实例时也能正常显示 tooltip，或者提供官方的最佳实践指导。

## 相关信息

- 此问题可能与 Vue 3 的响应式系统和 ECharts 的事件系统之间的兼容性有关
- 建议检查是否需要使用 `markRaw()` 或 `shallowRef()` 来避免深度响应式包装
- 可能需要在 ECharts 官方文档中添加 Vue 3 集成的最佳实践说明
