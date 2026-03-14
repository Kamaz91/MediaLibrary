import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Check stored password before mounting to avoid flash of login screen
import { useUserStore } from '@/stores/userStore';
import { setCdnUrl, setServeFilesLocally } from '@/api/fileApi';

const userStore = useUserStore();

async function init() {
  // Load public config before mounting
  try {
    const info = await axios.get('/api/info');
    setServeFilesLocally(info.data.serveFilesLocally ?? false);
    if (info.data.cdnUrl) setCdnUrl(info.data.cdnUrl);
  } catch {
    // non-critical, fall back to proxying through API
  }

  if (userStore.password) {
    try {
      await axios.post('/api/auth/login', null, {
        headers: { 'x-password': userStore.password },
      });
      userStore.setAuthenticated(true);
    } catch {
      userStore.logout();
    }
  }
  app.mount('#app');
}

init();
