<template>
  <div id="outerContainer">
    <div id="mainContainer">
      <PDFToolbar 
        :pageNumber="currentPage"
        :totalPages="totalPages"
        :scale="scale"
        @pageChange="handlePageChange"
        @scaleChange="handleScaleChange"
      />
      
      <div id="viewerContainer" tabindex="0">
        <div id="viewer" class="pdfViewer">
          <!-- PDF pages will be rendered here -->
        </div>
      </div>
    </div>

    <PDFSidebar 
      v-if="showSidebar"
      @close="toggleSidebar"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PDFToolbar from './components/PDFToolbar.vue'
import PDFSidebar from './components/PDFSidebar.vue'

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
}

#mainContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

#viewerContainer {
  flex: 1;
  overflow: auto;
  background-color: #525659;
}

.pdfViewer {
  position: relative;
  margin: 0 auto;
  padding: 1rem;
}
</style> 