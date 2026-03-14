import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const password = ref<string>(localStorage.getItem('medialibrary-password') ?? '');
  const isAuthenticated = ref<boolean>(false);

  function setPassword(pwd: string) {
    password.value = pwd;
    localStorage.setItem('medialibrary-password', pwd);
  }

  function setAuthenticated(val: boolean) {
    isAuthenticated.value = val;
  }

  function logout() {
    password.value = '';
    isAuthenticated.value = false;
    localStorage.removeItem('medialibrary-password');
  }

  return { password, isAuthenticated, setPassword, setAuthenticated, logout };
});
