<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')

async function handleLogin() {
  try {
    errorMessage.value = ''

    await authStore.login(email.value, password.value)

    router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось войти'
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card">
      <h1>Вход</h1>

      <form class="login-form" @submit.prevent="handleLogin">
        <label>
          Email
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
          />
        </label>

        <label>
          Пароль
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </label>

        <p class="login-error">
          {{ errorMessage }}
        </p>

        <button type="submit" :disabled="authStore.isLoading">
          {{ authStore.isLoading ? 'Входим...' : 'Войти' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  border: 1px solid #ddd;
  border-radius: 12px;
  background: #fff;
}

.login-card h1 {
  margin: 0 0 20px;
}

.login-form {
  display: grid;
  gap: 14px;
}

.login-form label {
  display: grid;
  gap: 6px;
}

.login-form input {
  padding: 8px 10px;
}

.login-error {
  min-height: 20px;
  margin: 0;
  color: #b00020;
  font-size: 14px;
}

.login-form button {
  padding: 10px 12px;
  cursor: pointer;
}
</style>