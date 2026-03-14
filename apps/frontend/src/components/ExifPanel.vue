<template>
  <div class="exif-overlay" @click.self="emit('close')">
    <div class="exif-panel">
      <div class="exif-header">
        <h3>EXIF: {{ file.name }}</h3>
        <button @click="emit('close')" class="close-btn">&#x2715;</button>
      </div>
      <div class="exif-body">
        <div v-if="loading" class="loading">Ladowanie EXIF...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else-if="!exifData || Object.keys(exifData).length === 0" class="empty">Brak danych EXIF</div>
        <table v-else class="exif-table">
          <tbody>
            <tr v-for="(value, key) in flatExif" :key="key">
              <td class="exif-key">{{ key }}</td>
              <td class="exif-val">{{ formatValue(value) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { FileItem } from '@/types';
import { fetchAuthBlob } from '@/api/fileApi';

const props = defineProps<{ file: FileItem }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const loading = ref(true);
const error = ref('');
const exifData = ref<Record<string, unknown> | null>(null);

const flatExif = computed(() => {
  if (!exifData.value) return {};
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(exifData.value)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date)) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        flat[`${k}.${k2}`] = v2;
      }
    } else {
      flat[k] = v;
    }
  }
  return flat;
});

function formatValue(v: unknown): string {
  if (v instanceof Date) return v.toLocaleString('pl-PL');
  if (Array.isArray(v)) return v.join(', ');
  if (v === null || v === undefined) return '--';
  return String(v);
}

onMounted(async () => {
  try {
    const objectUrl = await fetchAuthBlob(props.file.path);
    const response = await fetch(objectUrl);
    const blob = await response.blob();
    URL.revokeObjectURL(objectUrl);
    const { default: exifr } = await import('exifr');
    const data = await exifr.parse(blob, { tiff: true, exif: true, gps: true, iptc: true });
    exifData.value = data || {};
  } catch (e) {
    error.value = 'Nie mozna odczytac danych EXIF';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.exif-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 900;
}
.exif-panel {
  background: #16213e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.exif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.exif-header h3 { font-size: 1rem; color: #e0e0e0; }
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
.exif-body {
  overflow-y: auto;
  padding: 16px 20px;
  flex: 1;
}
.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  color: #888;
}
.error { color: #e94560; }
.exif-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
.exif-key {
  padding: 5px 10px 5px 0;
  color: #888;
  white-space: nowrap;
  vertical-align: top;
  width: 40%;
}
.exif-val {
  padding: 5px 0;
  color: #ccc;
  word-break: break-all;
}
tr:nth-child(even) { background: rgba(255,255,255,0.03); }
</style>
