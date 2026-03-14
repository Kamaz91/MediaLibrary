import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const password = ref<string>(localStorage.getItem('galeria-password') ?? '');
  const isAuthenticated = ref<boolean>(false);

  function setPassword(pwd: string) {
    password.value = pwd;
    localStorage.setItem('galeria-password', pwd);
  }

  function setAuthenticated(val: boolean) {
    isAuthenticated.value = val;
  }

  function logout() {
    password.value = '';
    isAuthenticated.value = false;
    localStorage.removeItem('galeria-password');
  }

  return { password, isAuthenticated, setPassword, setAuthenticated, logout };
});
