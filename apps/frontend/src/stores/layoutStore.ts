import { defineStore } from 'pinia';
import { ref } from 'vue';

export type LayoutMode = 'grid' | 'list';

export const useLayoutStore = defineStore('layout', () => {
  const mode = ref<LayoutMode>((localStorage.getItem('medialibrary-layout') as LayoutMode) ?? 'grid');

  function setMode(m: LayoutMode) {
    mode.value = m;
    localStorage.setItem('medialibrary-layout', m);
  }

  return { mode, setMode };
});
