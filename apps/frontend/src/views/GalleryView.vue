<template>
  <div class="gallery-layout">
    <header class="gallery-header">
      <div class="header-left">
        <span class="logo">MediaLibrary</span>
        <Breadcrumb :path="galleryStore.currentPath" @navigate="navigateTo" />
      </div>
      <div class="header-right">
        <span class="server-path">{{ serverPathDisplay }}</span>
        <button @click="layoutStore.setMode('grid')" :class="['layout-btn', { active: layoutStore.mode === 'grid' }]" title="Siatka">&#9707;</button>
        <button @click="layoutStore.setMode('list')" :class="['layout-btn', { active: layoutStore.mode === 'list' }]" title="Lista">&#9776;</button>
        <button @click="logout" class="logout-btn">Wyloguj</button>
      </div>
    </header>
    <div class="action-bar">
      <button @click="showNewFolder = true" class="action-btn">+ Nowy folder</button>
      <label class="action-btn upload-label">
        + Dodaj pliki
        <input type="file" multiple @change="handleFileInput" style="display:none" />
      </label>
      <div v-if="galleryStore.error" class="error-banner">{{ galleryStore.error }}</div>
    </div>
    <UploadProgress :tasks="uploadTasks" @cancel="cancelUpload" />
    <main
      class="gallery-main"
      :class="{ 'gallery-main--drag': isDragOver }"
      @dragenter.prevent="dragCounter++"
      @dragleave.prevent="if (--dragCounter <= 0) { dragCounter = 0; isDragOver = false; } else isDragOver = true"
      @dragover.prevent="isDragOver = true"
      @drop.prevent="handleDrop"
    >
      <div v-if="isDragOver" class="drop-overlay">
        <div class="drop-overlay-inner">
          <span class="drop-icon">&#9650;</span>
          <span>Upusc pliki tutaj</span>
        </div>
      </div>
      <div v-if="galleryStore.loading" class="loading">Ladowanie...</div>
      <div v-else-if="galleryStore.items.length === 0" class="empty">Brak plikow w tym folderze</div>
      <template v-else>
        <FileGrid
          v-if="layoutStore.mode === 'grid'"
          :items="galleryStore.items"
          :server-url="serverUrl"
          @open-folder="navigateTo"
          @open-image="openImage"
          @open-text="openText"
          @delete="deleteItem"
          @rename="startRename"
          @show-exif="showExif"
        />
        <FileList
          v-else
          :items="galleryStore.items"
          :server-url="serverUrl"
          @open-folder="navigateTo"
          @open-image="openImage"
          @open-text="openText"
          @delete="deleteItem"
          @rename="startRename"
          @show-exif="showExif"
        />
      </template>
    </main>
    <ImageModal
      v-if="imageModalVisible"
      :items="imageItems"
      :initial-index="imageIndex"
      @close="imageModalVisible = false"
    />
    <ExifPanel v-if="exifFile" :file="exifFile" @close="exifFile = null" />
    <TextViewer v-if="textFile" :file="textFile" @close="textFile = null" />
    <NewFolderDialog v-if="showNewFolder" @create="createFolder" @close="showNewFolder = false" />
    <RenameDialog v-if="renameTarget" :item="renameTarget" @rename="doRename" @close="renameTarget = null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGalleryStore } from '@/stores/galleryStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useUserStore } from '@/stores/userStore';
import type { FileItem, UploadTask } from '@/types';
import { deleteItem as apiDelete, renameItem, createFolder as apiCreateFolder, uploadFiles } from '@/api/fileApi';
import Breadcrumb from '@/components/Breadcrumb.vue';
import FileGrid from '@/components/FileGrid.vue';
import FileList from '@/components/FileList.vue';
import ImageModal from '@/components/ImageModal.vue';
import ExifPanel from '@/components/ExifPanel.vue';
import TextViewer from '@/components/TextViewer.vue';
import NewFolderDialog from '@/components/NewFolderDialog.vue';
import RenameDialog from '@/components/RenameDialog.vue';
import UploadProgress from '@/components/UploadProgress.vue';

const router = useRouter();
const galleryStore = useGalleryStore();
const layoutStore = useLayoutStore();
const userStore = useUserStore();

const serverUrl = window.location.origin;
const imageModalVisible = ref(false);
const imageIndex = ref(0);
const exifFile = ref<FileItem | null>(null);
const textFile = ref<FileItem | null>(null);
const showNewFolder = ref(false);
const renameTarget = ref<FileItem | null>(null);
const uploadTasks = ref<UploadTask[]>([]);
const isDragOver = ref(false);
let dragCounter = 0;

const imageItems = computed(() => galleryStore.items.filter(i => isImage(i.name)));

const serverPathDisplay = computed(() => {
  const path = galleryStore.currentPath === '/' ? '' : galleryStore.currentPath;
  return `${serverUrl}${path}`;
});

function isImage(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}

function navigateTo(path: string) {
  galleryStore.navigateTo(path);
}

function openImage(item: FileItem) {
  imageIndex.value = imageItems.value.findIndex(i => i.path === item.path);
  imageModalVisible.value = true;
}

function openText(item: FileItem) {
  textFile.value = item;
}

function showExif(item: FileItem) {
  exifFile.value = item;
}

async function deleteItem(item: FileItem) {
  if (!confirm(`Usunac "${item.name}"?`)) return;
  await apiDelete(item.path);
  await galleryStore.refresh();
}

function startRename(item: FileItem) {
  renameTarget.value = item;
}

async function doRename(item: FileItem, newName: string) {
  await renameItem(item.path, newName);
  renameTarget.value = null;
  await galleryStore.refresh();
}

async function createFolder(name: string) {
  await apiCreateFolder(galleryStore.currentPath, name);
  showNewFolder.value = false;
  await galleryStore.refresh();
}

function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  Array.from(input.files).forEach(file => startUpload(file));
  input.value = '';
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false;
  dragCounter = 0;
  const files = e.dataTransfer?.files;
  if (!files?.length) return;
  Array.from(files).forEach(file => startUpload(file));
}

function startUpload(file: File) {
  const taskId = `${Date.now()}-${Math.random()}`;
  const task: UploadTask = {
    id: taskId,
    fileName: file.name,
    progress: 0,
    status: 'uploading',
    cancel: () => {},
  };
  uploadTasks.value.push(task);

  const uploadTaskRef = { uploadId: null as string | null };
  const { promise, cancel } = uploadFiles(
    galleryStore.currentPath,
    [file],
    (progress) => {
      const t = uploadTasks.value.find(t => t.id === taskId);
      if (t) t.progress = progress;
    },
    uploadTaskRef
  );

  task.cancel = () => {
    cancel();
    const t = uploadTasks.value.find(t => t.id === taskId);
    if (t) t.status = 'cancelled';
    setTimeout(() => removeTask(taskId), 2000);
  };

  promise
    .then(() => {
      const t = uploadTasks.value.find(t => t.id === taskId);
      if (t && t.status === 'uploading') {
        t.status = 'done';
        t.progress = 100;
      }
      galleryStore.refresh();
      setTimeout(() => removeTask(taskId), 3000);
    })
    .catch(() => {
      const t = uploadTasks.value.find(t => t.id === taskId);
      if (t && t.status === 'uploading') t.status = 'error';
      setTimeout(() => removeTask(taskId), 4000);
    });
}

function removeTask(id: string) {
  const idx = uploadTasks.value.findIndex(t => t.id === id);
  if (idx !== -1) uploadTasks.value.splice(idx, 1);
}

function cancelUpload(id: string) {
  const task = uploadTasks.value.find(t => t.id === id);
  if (task) task.cancel();
}

function logout() {
  userStore.logout();
  router.push('/login');
}

onMounted(() => {
  galleryStore.navigateTo('/');
});
</script>

<style scoped>
.gallery-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}
.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  gap: 12px;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.logo {
  font-size: 1.3rem;
  font-weight: 700;
  background: linear-gradient(135deg, #e94560, #0f3460);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.server-path {
  font-size: 0.75rem;
  color: #666;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.layout-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #888;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}
.layout-btn.active, .layout-btn:hover {
  background: rgba(233,69,96,0.2);
  border-color: #e94560;
  color: #e94560;
}
.logout-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #888;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}
.logout-btn:hover {
  background: rgba(233,69,96,0.1);
  border-color: #e94560;
  color: #e94560;
}
.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.action-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #ccc;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}
.action-btn:hover {
  background: rgba(233,69,96,0.15);
  border-color: #e94560;
  color: #e94560;
}
.upload-label {
  display: inline-block;
  cursor: pointer;
}
.error-banner {
  background: rgba(233,69,96,0.15);
  border: 1px solid #e94560;
  color: #e94560;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-left: auto;
}
.gallery-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
}
.gallery-main--drag {
  outline: 2px dashed #e94560;
  outline-offset: -4px;
  background: rgba(233,69,96,0.04);
}
.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}
.drop-overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: rgba(26,26,46,0.85);
  border: 2px dashed #e94560;
  border-radius: 16px;
  padding: 48px 80px;
  color: #e94560;
  font-size: 1.2rem;
  font-weight: 600;
}
.drop-icon {
  font-size: 3rem;
}
.loading {
  text-align: center;
  color: #666;
  padding: 60px;
  font-size: 1.1rem;
}
.empty {
  text-align: center;
  color: #555;
  padding: 60px;
  font-size: 1.1rem;
}
</style>
