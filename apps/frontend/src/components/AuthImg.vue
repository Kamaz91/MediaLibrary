<template>
  <img
    ref="imgEl"
    v-bind="$attrs"
    :src="blobSrc ?? undefined"
    :class="{ 'auth-img--loading': !blobSrc }"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { fetchAuthBlob } from '@/api/fileApi';

const props = defineProps<{ path: string }>();

const imgEl = ref<HTMLImageElement | null>(null);
const blobSrc = ref<string | null>(null);

let objectUrl: string | null = null;
let observer: IntersectionObserver | null = null;
let loaded = false;

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const url = await fetchAuthBlob(props.path);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = url;
    blobSrc.value = url;
  } catch {
    // silently ignore failed image loads
  }
}

watch(() => props.path, () => {
  loaded = false;
  blobSrc.value = null;
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
  load();
});

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => { if (entries[0].isIntersecting) load(); },
    { rootMargin: '100px' }
  );
  if (imgEl.value) observer.observe(imgEl.value);
});

onUnmounted(() => {
  observer?.disconnect();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
</script>

<style scoped>
.auth-img--loading {
  background: rgba(255, 255, 255, 0.04);
}
</style>
