<template>
  <div class="file-grid">
    <div
      v-for="item in items"
      :key="item.path"
      :class="['file-card', { 'file-card--dir': item.isDirectory }]"
      @click="handleClick(item)"
    >
      <div class="file-thumb">
        <AuthImg
          v-if="isImage(item.name) && !item.isDirectory"
          :path="item.path"
          :alt="item.name"
          class="thumb-img"
        />
        <span v-else class="file-icon">{{ getIcon(item) }}</span>
      </div>
      <div class="file-info">
        <span class="file-name" :title="item.name">{{ item.name }}</span>
        <span v-if="!item.isDirectory" class="file-size">{{ formatSize(item.size) }}</span>
      </div>
      <div class="file-actions">
        <button @click.stop="emit('show-exif', item)" v-if="isImage(item.name)" title="EXIF" class="btn-icon">i</button>
        <button @click.stop="emit('rename', item)" title="Zmien nazwe" class="btn-icon">&#9998;</button>
        <button @click.stop="emit('delete', item)" title="Usun" class="btn-icon btn-danger">&#128465;</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileItem } from '@/types';
import AuthImg from '@/components/AuthImg.vue';

const props = defineProps<{ items: FileItem[]; serverUrl: string }>();
const emit = defineEmits<{
  (e: 'open-folder', path: string): void;
  (e: 'open-image', item: FileItem): void;
  (e: 'open-text', item: FileItem): void;
  (e: 'delete', item: FileItem): void;
  (e: 'rename', item: FileItem): void;
  (e: 'show-exif', item: FileItem): void;
}>();

function isImage(name: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);
}
function isText(name: string) {
  return /\.(txt|js|ts|json|md|html|css|csv|xml|log)$/i.test(name);
}
function getIcon(item: FileItem) {
  if (item.isDirectory) return '📁';
  if (isImage(item.name)) return '🖼️';
  if (isText(item.name)) return '📄';
  return '📎';
}
function formatSize(size: number | null) {
  if (size === null) return '';
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
  return (size / (1024 * 1024)).toFixed(1) + ' MB';
}

function handleClick(item: FileItem) {
  if (item.isDirectory) {
    emit('open-folder', item.path);
  } else if (isImage(item.name)) {
    emit('open-image', item);
  } else if (isText(item.name)) {
    emit('open-text', item);
  }
}
</script>

<style scoped>
.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.file-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.file-card:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(233,69,96,0.3);
  transform: translateY(-2px);
}
.file-card--dir {
  border-color: rgba(255,200,0,0.2);
}
.file-card--dir:hover {
  border-color: rgba(255,200,0,0.5);
}
.file-thumb {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 6px;
  background: rgba(0,0,0,0.2);
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.file-icon {
  font-size: 2.5rem;
}
.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.file-name {
  font-size: 0.8rem;
  color: #ccc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-size {
  font-size: 0.7rem;
  color: #555;
}
.file-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}
.file-card:hover .file-actions {
  opacity: 1;
}
.btn-icon {
  background: rgba(255,255,255,0.08);
  border: none;
  color: #aaa;
  padding: 3px 7px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
}
.btn-icon:hover {
  background: rgba(255,255,255,0.15);
  color: white;
}
.btn-danger:hover {
  background: rgba(233,69,96,0.3);
  color: #e94560;
}
</style>
