<template>
  <div id="outerContainer" :class="{ sidebarOpen: showSidebar }">
    <div id="mainContainer">
      <PDFToolbar 
        :pageNumber="currentPage"
        :totalPages="totalPages"
        :scale="scale"
        @pageChange="handlePageChange"
        @scaleChange="handleScaleChange"
        @toggleSidebar="toggleSidebar"
      />
      
      <div id="viewerContainer" tabindex="0">
        <div id="viewer" class="pdfViewer">
          <!-- PDF pages will be rendered here -->
        </div>
      </div>
    </div>

    <PDFSidebar 
      v-if="showSidebar"
      :currentPage="currentPage"
      :totalPages="totalPages"
      @close="toggleSidebar"
      @pageChange="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PDFToolbar from './PDFToolbar.vue'
import PDFSidebar from './PDFSidebar.vue'
import './styles/pdf-viewer.css'

// State
const showSidebar = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)

// Methods
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

const handlePageChange = (newPage) => {
  currentPage.value = newPage
}

const handleScaleChange = (newScale) => {
  scale.value = newScale
}

onMounted(() => {
  // Initialize PDF.js and load document
})
</script>

<style scoped>
#outerContainer {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: var(--viewer-bg-color);
}

#mainContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-inline-start var(--sidebar-transition-duration) var(--sidebar-transition-timing-function);
}

#viewerContainer {
  flex: 1;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.pdfViewer {
  position: relative;
  margin: 0 auto;
  padding: var(--page-margin);
}

/* Sidebar transition */
:deep(#sidebarContainer) {
  transition: transform var(--sidebar-transition-duration) var(--sidebar-transition-timing-function);
}

@media screen and (max-width: 840px) {
  #mainContainer {
    margin-inline-start: calc(var(--sidebar-width) * -1);
  }
  
  :deep(#sidebarContainer) {
    transform: translateX(calc(var(--sidebar-width) * -1));
  }
}

@media screen and (max-width: 840px) {
  .sidebarOpen :deep(#sidebarContainer) {
    transform: translateX(0);
  }
  
  .sidebarOpen #mainContainer {
    margin-inline-start: 0;
  }
}
</style> 