<template>
  <div class="toolbar">
    <div class="toolbarContainer">
      <div class="toolbarViewer">
        <!-- Left section -->
        <div class="toolbarViewerLeft toolbarHorizontalGroup">
          <button 
            class="toolbarButton"
            @click="$emit('toggleSidebar')"
            type="button"
            title="Toggle Sidebar"
          >
            <span class="icon">☰</span>
          </button>

          <div class="toolbarVerticalSeparator"></div>

          <div class="pageControls toolbarHorizontalGroup">
            <button 
              class="toolbarButton"
              @click="prevPage"
              :disabled="pageNumber <= 1"
              type="button"
              title="Previous Page"
            >
              <span class="icon">◀</span>
            </button>

            <div class="pageNumberControl toolbarHorizontalGroup">
              <input 
                type="number" 
                class="pageNumber" 
                :value="pageNumber"
                @input="handlePageInput"
                :min="1"
                :max="totalPages"
              />
              <span class="pageSeparator">/</span>
              <span class="totalPages">{{ totalPages }}</span>
            </div>

            <button 
              class="toolbarButton"
              @click="nextPage"
              :disabled="pageNumber >= totalPages"
              type="button"
              title="Next Page"
            >
              <span class="icon">▶</span>
            </button>
          </div>
        </div>

        <!-- Middle section -->
        <div class="toolbarViewerMiddle toolbarHorizontalGroup">
          <div class="zoomControls toolbarHorizontalGroup">
            <button 
              class="toolbarButton"
              @click="zoomOut"
              type="button"
              title="Zoom Out"
            >
              <span class="icon">-</span>
            </button>

            <select 
              class="scaleSelect"
              :value="scale"
              @change="handleScaleChange"
            >
              <option value="auto">Automatic Zoom</option>
              <option value="page-actual">Actual Size</option>
              <option value="page-fit">Page Fit</option>
              <option value="page-width">Page Width</option>
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2">200%</option>
            </select>

            <button 
              class="toolbarButton"
              @click="zoomIn"
              type="button"
              title="Zoom In"
            >
              <span class="icon">+</span>
            </button>
          </div>
        </div>

        <!-- Right section -->
        <div class="toolbarViewerRight toolbarHorizontalGroup">
          <button 
            class="toolbarButton hiddenSmallScreen"
            @click="print"
            type="button"
            title="Print"
          >
            <span class="icon">🖨️</span>
          </button>

          <button 
            class="toolbarButton"
            @click="download"
            type="button"
            title="Download"
          >
            <span class="icon">💾</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  pageNumber: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  scale: {
    type: [Number, String],
    default: 1
  }
})

const emit = defineEmits(['pageChange', 'scaleChange', 'toggleSidebar'])

// Page navigation
const prevPage = () => {
  if (props.pageNumber > 1) {
    emit('pageChange', props.pageNumber - 1)
  }
}

const nextPage = () => {
  if (props.pageNumber < props.totalPages) {
    emit('pageChange', props.pageNumber + 1)
  }
}

const handlePageInput = (event) => {
  const page = parseInt(event.target.value)
  if (page >= 1 && page <= props.totalPages) {
    emit('pageChange', page)
  }
}

// Zoom controls
const zoomIn = () => {
  if (typeof props.scale === 'number') {
    emit('scaleChange', props.scale * 1.1)
  }
}

const zoomOut = () => {
  if (typeof props.scale === 'number') {
    emit('scaleChange', props.scale * 0.9)
  }
}

const handleScaleChange = (event) => {
  emit('scaleChange', event.target.value)
}

// Actions
const print = () => {
  window.print()
}

const download = () => {
  // Implement PDF download logic
}
</script>

<style scoped>
.toolbar {
  height: var(--toolbar-height);
  background-color: var(--toolbar-bg-color);
  border-bottom: var(--toolbar-border-bottom);
  box-shadow: var(--toolbar-box-shadow);
}

.toolbarContainer {
  height: 100%;
  padding: var(--toolbar-vertical-padding) var(--toolbar-horizontal-padding);
}

.toolbarViewer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.pageNumberControl {
  display: flex;
  align-items: center;
  background-color: white;
  border: 1px solid var(--toolbar-border-color);
  border-radius: 4px;
  padding: 2px 6px;
}

.pageNumber {
  width: 40px;
  text-align: right;
  border: none;
  outline: none;
  padding: 2px;
}

.pageSeparator {
  padding: 0 4px;
  color: var(--icon-color);
}

.totalPages {
  min-width: 16px;
  text-align: left;
  color: var(--icon-color);
}

.scaleSelect {
  min-width: 100px;
  padding: 4px 24px 4px 8px;
  border: 1px solid var(--toolbar-border-color);
  border-radius: 4px;
  background-color: white;
  color: var(--icon-color);
  font-size: 12px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
}

.icon {
  font-size: var(--icon-size);
}

@media screen and (max-width: 640px) {
  .pageNumberControl {
    padding: 1px 4px;
  }
  
  .pageNumber {
    width: 30px;
  }
  
  .scaleSelect {
    min-width: 80px;
  }
}
</style> 