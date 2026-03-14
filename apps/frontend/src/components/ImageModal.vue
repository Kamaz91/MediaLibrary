<template>
  <div class="modal-overlay" @click.self="emit('close')" tabindex="0" ref="overlayRef">
    <button class="modal-close" @click="emit('close')">&#x2715;</button>
    <button v-if="items.length > 1" class="nav-btn nav-prev" @click="prev">&#8592;</button>
    <div class="modal-content">
      <AuthImg v-if="currentItem" :path="currentItem.path" :alt="currentItem.name" class="modal-img" />
      <div class="modal-caption">
        <span class="caption-name">{{ currentItem?.name }}</span>
        <span class="caption-count" v-if="items.length > 1">{{ currentIndex + 1 }} / {{ items.length }}</span>
      </div>
    </div>
    <button v-if="items.length > 1" class="nav-btn nav-next" @click="next">&#8594;</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { FileItem } from '@/types';
import AuthImg from '@/components/AuthImg.vue';

const props = defineProps<{ items: FileItem[]; initialIndex: number }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const currentIndex = ref(props.initialIndex);
const overlayRef = ref<HTMLElement | null>(null);

const currentItem = computed(() => props.items[currentIndex.value]);

function prev() {
  if (currentIndex.value > 0) currentIndex.value--;
  else currentIndex.value = props.items.length - 1;
}
function next() {
  if (currentIndex.value < props.items.length - 1) currentIndex.value++;
  else currentIndex.value = 0;
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
  if (e.key === 'ArrowLeft') prev();
  if (e.key === 'ArrowRight') next();
}

onMounted(() => {
  window.addEventListener('keydown', handleKey);
  overlayRef.value?.focus();
});
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  outline: none;
}
.modal-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  font-size: 1.5rem;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  z-index: 10;
  transition: background 0.2s;
}
.modal-close:hover { background: rgba(233,69,96,0.4); }
.modal-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.modal-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}
.modal-caption {
  display: flex;
  gap: 16px;
  color: #ccc;
  font-size: 0.875rem;
}
.caption-count { color: #888; }
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.1);
  border: none;
  color: white;
  font-size: 2rem;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  z-index: 10;
}
.nav-btn:hover { background: rgba(233,69,96,0.3); }
.nav-prev { left: 16px; }
.nav-next { right: 16px; }
</style>
