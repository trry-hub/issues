<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as echarts from 'echarts'

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
let chartInstance: null | echarts.ECharts = null
const chartInstanceVueRef = ref()
const chartDom = ref()
const chartDomUseRef = ref()

// 渲染图表
async function renderChart() {
  if (!chartInstance) {
    chartInstance = echarts.init(chartDom.value)
  }
  chartInstance.setOption(option)
}

async function renderChartUseRef() {
  if (!chartInstanceVueRef.value) {
    chartInstanceVueRef.value = echarts.init(chartDomUseRef.value)
  }
  chartInstanceVueRef.value.setOption(option)
}
// 生命周期
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
<style scoped>
.chart-container {
  margin-bottom: 10px;
  border-width: 1px;
  border-style: solid;
  width: 500px;
  height: 300px;
  margin: 0 auto;
  margin-bottom: 40px;
}
.chart-container>div {
  width: 100%;
  height: 100%;
}
</style>