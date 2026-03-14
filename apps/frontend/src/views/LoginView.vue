<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="login-title">Galeria</h1>
      <p class="login-subtitle">Wprowadz haslo aby kontynuowac</p>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <input
            v-model="password"
            type="password"
            placeholder="Haslo..."
            class="login-input"
            autofocus
          />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Sprawdzam...' : 'Zaloguj sie' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserStore } from '@/stores/userStore';

const router = useRouter();
const userStore = useUserStore();
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!password.value) return;
  loading.value = true;
  error.value = '';
  try {
    await axios.post('/api/auth/login', null, {
      headers: { 'x-password': password.value },
    });
    userStore.setPassword(password.value);
    userStore.setAuthenticated(true);
    router.push('/');
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      error.value = 'Nieprawidlowe haslo';
    } else {
      error.value = 'Blad polaczenia z serwerem';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}
.login-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(10px);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  background: linear-gradient(135deg, #e94560, #0f3460);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}
.login-subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 32px;
  font-size: 0.9rem;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.login-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.login-input:focus {
  border-color: #e94560;
}
.login-btn {
  padding: 14px;
  background: linear-gradient(135deg, #e94560, #c62a47);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-msg {
  color: #e94560;
  font-size: 0.875rem;
  text-align: center;
}
</style>
