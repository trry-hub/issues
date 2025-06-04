<template>
  <div id="sidebarContainer">
    <div id="toolbarSidebar" class="toolbarHorizontalGroup">
      <div class="toolbarButtons toolbarHorizontalGroup">
        <button 
          class="toolbarButton"
          :class="{ active: currentView === 'thumbnails' }"
          @click="currentView = 'thumbnails'"
          type="button"
          title="Show Thumbnails"
        >
          <span class="icon">📑</span>
        </button>
        <button 
          class="toolbarButton"
          :class="{ active: currentView === 'outline' }"
          @click="currentView = 'outline'"
          type="button"
          title="Show Document Outline"
        >
          <span class="icon">📋</span>
        </button>
        <button 
          class="toolbarButton"
          :class="{ active: currentView === 'attachments' }"
          @click="currentView = 'attachments'"
          type="button"
          title="Show Attachments"
        >
          <span class="icon">📎</span>
        </button>
      </div>
      <button 
        class="toolbarButton close"
        @click="$emit('close')"
        type="button"
        title="Close Sidebar"
      >
        <span class="icon">✕</span>
      </button>
    </div>

    <div id="sidebarContent">
      <!-- Thumbnails View -->
      <div 
        id="thumbnailView"
        v-show="currentView === 'thumbnails'"
        class="sidebarView"
      >
        <div 
          v-for="n in totalPages" 
          :key="n"
          class="thumbnail"
          :class="{ active: currentPage === n }"
          @click="$emit('pageChange', n)"
        >
          <div class="thumbnailNumber">{{ n }}</div>
          <!-- Thumbnail image would be rendered here -->
          <div class="thumbnailImage"></div>
        </div>
      </div>

      <!-- Outline View -->
      <div 
        id="outlineView"
        v-show="currentView === 'outline'"
        class="sidebarView"
      >
        <div v-if="outline.length" class="outlineList">
          <div 
            v-for="(item, index) in outline" 
            :key="index"
            class="outlineItem"
            @click="handleOutlineClick(item)"
          >
            {{ item.title }}
          </div>
        </div>
        <div v-else class="emptyMessage">
          No outline available
        </div>
      </div>

      <!-- Attachments View -->
      <div 
        id="attachmentsView"
        v-show="currentView === 'attachments'"
        class="sidebarView"
      >
        <div v-if="attachments.length" class="attachmentsList">
          <div 
            v-for="(attachment, index) in attachments" 
            :key="index"
            class="attachmentItem"
            @click="handleAttachmentClick(attachment)"
          >
            {{ attachment.name }}
          </div>
        </div>
        <div v-else class="emptyMessage">
          No attachments available
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    default: 1
  },
  totalPages: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'pageChange'])

const currentView = ref('thumbnails')
const outline = ref([])
const attachments = ref([])

const handleOutlineClick = (item) => {
  // Handle outline item click
  if (item.page) {
    emit('pageChange', item.page)
  }
}

const handleAttachmentClick = (attachment) => {
  // Handle attachment click
  if (attachment.url) {
    window.open(attachment.url, '_blank')
  }
}
</script>

<style scoped>
#sidebarContainer {
  width: var(--sidebar-width);
  background-color: var(--sidebar-bg-color);
  border-inline-end: 1px solid var(--sidebar-border-color);
  display: flex;
  flex-direction: column;
}

#toolbarSidebar {
  height: var(--toolbar-height);
  padding: var(--toolbar-vertical-padding) 8px;
  justify-content: space-between;
  border-bottom: var(--toolbar-border-bottom);
}

#sidebarContent {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebarView {
  height: 100%;
}

.thumbnail {
  margin: 8px 0;
  padding: 8px;
  background-color: white;
  border: 1px solid var(--toolbar-border-color);
  border-radius: var(--page-border-radius);
  cursor: pointer;
  transition: border-color 0.2s;
}

.thumbnail.active {
  border-color: #2196f3;
}

.thumbnailNumber {
  font-size: 12px;
  color: var(--icon-color);
  margin-bottom: 4px;
}

.thumbnailImage {
  width: 100%;
  height: 150px;
  background-color: var(--viewer-bg-color);
  border-radius: 2px;
}

.outlineItem,
.attachmentItem {
  padding: 8px;
  cursor: pointer;
  border-radius: var(--page-border-radius);
  transition: background-color 0.2s;
}

.outlineItem:hover,
.attachmentItem:hover {
  background-color: var(--button-hover-color);
}

.attachmentItem {
  display: flex;
  align-items: center;
  gap: 8px;
}

.emptyMessage {
  padding: 16px;
  text-align: center;
  color: var(--icon-color);
}

.toolbarButton.active {
  background-color: var(--button-hover-color);
}

.toolbarButton.close {
  color: var(--icon-color);
}

/* Custom scrollbar styles */
#sidebarContent {
  scrollbar-width: thin;
  scrollbar-color: var(--toolbar-border-color) transparent;
}

#sidebarContent::-webkit-scrollbar {
  width: 8px;
}

#sidebarContent::-webkit-scrollbar-track {
  background: transparent;
}

#sidebarContent::-webkit-scrollbar-thumb {
  background-color: var(--toolbar-border-color);
  border-radius: 4px;
  border: 2px solid var(--sidebar-bg-color);
}
</style> 