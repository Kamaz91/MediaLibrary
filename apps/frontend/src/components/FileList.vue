<template>
  <div class="file-list">
    <div class="list-header">
      <span class="col-name">Nazwa</span>
      <span class="col-size">Rozmiar</span>
      <span class="col-date">Data modyfikacji</span>
      <span class="col-actions">Akcje</span>
    </div>
    <div
      v-for="item in items"
      :key="item.path"
      :class="['list-row', { 'list-row--dir': item.isDirectory }]"
      @click="handleClick(item)"
    >
      <span class="col-name">
        <span class="row-icon">{{ getIcon(item) }}</span>
        <span class="row-name" :title="item.name">{{ item.name }}</span>
      </span>
      <span class="col-size">{{ item.isDirectory ? '--' : formatSize(item.size) }}</span>
      <span class="col-date">{{ formatDate(item.modifiedAt) }}</span>
      <span class="col-actions" @click.stop>
        <button v-if="isImage(item.name)" @click="emit('show-exif', item)" title="EXIF" class="btn-icon">i</button>
        <button @click="emit('rename', item)" title="Zmien nazwe" class="btn-icon">&#9998;</button>
        <button @click="emit('delete', item)" title="Usun" class="btn-icon btn-danger">&#128465;</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FileItem } from '@/types';

const props = defineProps<{ items: FileItem[]; serverUrl: string }>();
const emit = defineEmits<{
  (e: 'open-folder', path: string): void;
  (e: 'open-image', item: FileItem): void;
  (e: 'open-text', item: FileItem): void;
  (e: 'delete', item: FileItem): void;
  (e: 'rename', item: FileItem): void;
  (e: 'show-exif', item: FileItem): void;
}>();

function isImage(name: string) { return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name); }
function isText(name: string) { return /\.(txt|js|ts|json|md|html|css|csv|xml|log)$/i.test(name); }
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
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pl-PL');
}

function handleClick(item: FileItem) {
  if (item.isDirectory) emit('open-folder', item.path);
  else if (isImage(item.name)) emit('open-image', item);
  else if (isText(item.name)) emit('open-text', item);
}
</script>

<style scoped>
.file-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.list-header {
  display: grid;
  grid-template-columns: 1fr 100px 160px 120px;
  gap: 12px;
  padding: 8px 12px;
  color: #666;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.list-row {
  display: grid;
  grid-template-columns: 1fr 100px 160px 120px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}
.list-row:hover {
  background: rgba(255,255,255,0.05);
}
.list-row--dir .col-name .row-name {
  color: #ffd700;
}
.col-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.row-icon { font-size: 1.1rem; flex-shrink: 0; }
.row-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  color: #ccc;
}
.col-size, .col-date {
  font-size: 0.8rem;
  color: #666;
}
.col-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.list-row:hover .col-actions {
  opacity: 1;
}
.btn-icon {
  background: rgba(255,255,255,0.08);
  border: none;
  color: #aaa;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s;
}
.btn-icon:hover { background: rgba(255,255,255,0.15); color: white; }
.btn-danger:hover { background: rgba(233,69,96,0.3); color: #e94560; }
</style>
