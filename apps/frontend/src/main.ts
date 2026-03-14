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

const userStore = useUserStore();

async function init() {
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
