<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { ElTable, ElTableColumn } from 'element-plus';
import 'element-plus/dist/index.css'

const tableData = ref([
  {
    id: 1,
    date: "2016-05-02",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1518 弄",
  },
  {
    id: 2,
    date: "2016-05-04",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1517 弄",
  },
  {
    id: 3,
    date: "2016-05-01",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1519 弄",
    hasChildren: true,
  },
  {
    id: 4,
    date: "2016-05-03",
    name: "王小虎",
    address: "上海市普陀区金沙江路 1516 弄",
  },
]);

const multipleSelection = ref([]);
const multipleTable = ref(null);

onMounted(() => {
  // 初始化逻辑
});

const load = (tree, treeNode, resolve) => {
  setTimeout(() => {
    const data = [
      {
        id: 31,
        date: "2016-05-01",
        name: "王小虎",
        address: "上海市普陀区金沙江路 1519 弄",
      },
      {
        id: 32,
        date: "2016-05-01",
        name: "王小虎",
        address: "上海市普陀区金沙江路 1519 弄",
      },
    ];
    tree.children = data;
    resolve(data);
    multipleTable.value.store.states.lazyTreeNodeMap[tree.id] = tree.children;

    let dt = multipleSelection.value.find((m) => m.id === tree.id);
    setChildren(tree.children, dt ? true : false);
  }, 1000);
};

const setChildren = (children, type) => {
  children.forEach((j) => {
    toggleSelection(j, type);
    if (j.children) {
      setChildren(j.children, type);
    }
  });
};

const selectRow = (selection, row) => {
  const hasSelect = selection.some((el) => row.id === el.id);
  if (hasSelect) {
    if (row.children) {
      setChildren(row.children, true);
    }
  } else {
    if (row.children) {
      setChildren(row.children, false);
    }
  }
};

const selectAll = (selection) => {
  console.log('selection: ', selection)
  const isSelect = selection.some((el) => tableData.value.map((j) => j.id).includes(el.id));
  const isCancel = !tableData.value.every((el) => selection.map((j) => j.id).includes(el.id));
  if (isSelect) {
    selection.forEach((el) => {
      if (el.children) {
        setChildren(el.children, true);
      }
    });
  }
  if (isCancel) {
    tableData.value.forEach((el) => {
      if (el.children) {
        setChildren(el.children, false);
      }
    });
  }
};

const toggleSelection = (row, select) => {
  if (row) {
    nextTick(() => {
      multipleTable.value.toggleRowSelection(row, select);
    });
  }
};

const handleSelectionChange = (selection) => {
  console.log('selection: ', selection)
  multipleSelection.value = selection;
};
</script>

<template>
  <div>
    <el-table :data="tableData" style="width: 100%" row-key="id" border lazy :load="load"
              :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" @select-all="selectAll"
              @selection-change="handleSelectionChange" @select="selectRow" ref="multipleTable">
      <el-table-column type="selection" width="55"> </el-table-column>
      <el-table-column prop="date" label="日期" width="180"> </el-table-column>
      <el-table-column prop="name" label="姓名" width="180"> </el-table-column>
      <el-table-column prop="address" label="地址"> </el-table-column>
    </el-table>
  </div>
</template>
