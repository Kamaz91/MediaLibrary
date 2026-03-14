<template>
  <nav class="breadcrumb">
    <span @click="emit('navigate', '/')" class="crumb crumb-home">~</span>
    <template v-for="(segment, idx) in segments" :key="idx">
      <span class="separator">/</span>
      <span
        @click="emit('navigate', buildPath(idx))"
        :class="['crumb', { 'crumb-last': idx === segments.length - 1 }]"
      >{{ segment }}</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ path: string }>();
const emit = defineEmits<{ (e: 'navigate', path: string): void }>();

const segments = computed(() => {
  return props.path.split('/').filter(Boolean);
});

function buildPath(idx: number) {
  return '/' + segments.value.slice(0, idx + 1).join('/');
}
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.875rem;
  color: #888;
  flex-wrap: wrap;
  overflow: hidden;
}
.crumb {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
  white-space: nowrap;
}
.crumb:hover {
  background: rgba(233,69,96,0.15);
  color: #e94560;
}
.crumb-last {
  color: #ccc;
  pointer-events: none;
}
.crumb-home {
  font-size: 1rem;
  font-weight: bold;
}
.separator {
  color: #444;
}
</style>
