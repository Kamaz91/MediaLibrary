<template>
  <div class="tv-overlay" @click.self="emit('close')">
    <div class="tv-panel">
      <div class="tv-header">
        <h3>{{ file.name }}</h3>
        <button @click="emit('close')" class="close-btn">&#x2715;</button>
      </div>
      <div class="tv-body">
        <div v-if="loading" class="tv-loading">Loading...</div>
        <div v-else-if="error" class="tv-error">{{ error }}</div>
        <pre v-else class="tv-content"><code>{{ content }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { FileItem } from '@/types';
import { getFileContent } from '@/api/fileApi';

const props = defineProps<{ file: FileItem }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const loading = ref(true);
const error = ref('');
const content = ref('');

onMounted(async () => {
  try {
    const data = await getFileContent(props.file.path);
    content.value = data.content;
  } catch {
    error.value = 'Failed to load file';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
}
.tv-panel {
  background: #0d0d1a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.tv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.tv-header h3 { font-size: 1rem; color: #e0e0e0; }
.close-btn {
  background: transparent;
  border: none;
  color: #888;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}
.close-btn:hover { color: #e94560; }
.tv-body { overflow-y: auto; flex: 1; }
.tv-loading, .tv-error {
  padding: 40px;
  text-align: center;
  color: #888;
}
.tv-error { color: #e94560; }
.tv-content {
  padding: 20px;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  color: #a8b9cc;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
