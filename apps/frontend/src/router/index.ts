import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import GalleryView from '@/views/GalleryView.vue';
import { useUserStore } from '@/stores/userStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/:pathMatch(.*)*', name: 'gallery', component: GalleryView, meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore();
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router;
