import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { FileItem } from '@/types';
import { listFiles } from '@/api/fileApi';

export const useGalleryStore = defineStore('gallery', () => {
  const currentPath = ref<string>('/');
  const items = ref<FileItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function navigateTo(path: string) {
    loading.value = true;
    error.value = null;
    try {
      const data = await listFiles(path);
      items.value = data.items;
      currentPath.value = path;
    } catch (e: unknown) {
      if (e instanceof Error) error.value = e.message;
      else error.value = 'Unknown error';
    } finally {
      loading.value = false;
    }
  }

  async function refresh() {
    await navigateTo(currentPath.value);
  }

  return { currentPath, items, loading, error, navigateTo, refresh };
});
