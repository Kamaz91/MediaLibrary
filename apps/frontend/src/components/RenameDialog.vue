<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <h3>Rename</h3>
      <input v-model="newName" type="text" class="dialog-input" @keyup.enter="submit" autofocus />
      <p v-if="error" class="dialog-error">{{ error }}</p>
      <div class="dialog-actions">
        <button @click="emit('close')" class="btn-cancel">Cancel</button>
        <button @click="submit" class="btn-confirm">Rename</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { FileItem } from '@/types';

const props = defineProps<{ item: FileItem }>();
const emit = defineEmits<{
  (e: 'rename', item: FileItem, newName: string): void;
  (e: 'close'): void;
}>();

const newName = ref(props.item.name);
const error = ref('');

function submit() {
  const trimmed = newName.value.trim();
  if (!trimmed) { error.value = 'Enter a name'; return; }
  if (/[<>:"|?*\\]/.test(trimmed)) { error.value = 'Invalid characters in name'; return; }
  if (trimmed === props.item.name) { emit('close'); return; }
  emit('rename', props.item, trimmed);
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 950;
}
.dialog {
  background: #16213e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 28px;
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.dialog h3 { color: #e0e0e0; font-size: 1.1rem; }
.dialog-input {
  padding: 10px 14px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 0.95rem;
  outline: none;
}
.dialog-input:focus { border-color: #e94560; }
.dialog-error { color: #e94560; font-size: 0.8rem; }
.dialog-actions { display: flex; gap: 10px; justify-content: flex-end; }
.btn-cancel {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: #888;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-cancel:hover { border-color: #aaa; color: #ccc; }
.btn-confirm {
  background: #e94560;
  border: none;
  color: white;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn-confirm:hover { background: #c62a47; }
</style>
