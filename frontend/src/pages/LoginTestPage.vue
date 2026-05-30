<script setup lang="ts">
import { ref } from 'vue'
import { getCurrentSession, signInWithEmail, signOut } from '../services/authService'
import { getCurrentProfile } from '../services/profileService'
import { getSupabaseTimers } from '../services/supabaseTimerService'

const email = ref('')
const password = ref('')
const message = ref('')
const isLoading = ref(false)

async function handleSignIn() {
  try {
    isLoading.value = true
    message.value = ''

    const data = await signInWithEmail(email.value, password.value)

    message.value = `Signed in as ${data.user.email}`
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleGetSession() {
  try {
    isLoading.value = true
    message.value = ''

    const session = await getCurrentSession()

    message.value = session
      ? `Current session: ${session.user.email}`
      : 'No active session'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleSignOut() {
  try {
    isLoading.value = true
    message.value = ''

    await signOut()

    message.value = 'Signed out'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleGetProfile() {
  try {
    isLoading.value = true
    message.value = ''

    const profile = await getCurrentProfile()

    message.value = profile
      ? `Profile: ${profile.email}, role: ${profile.role}`
      : 'No profile'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleGetTimers() {
  try {
    isLoading.value = true
    message.value = ''

    const timers = await getSupabaseTimers()

    message.value = `Timers loaded: ${timers.length}`
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main style="max-width: 420px; margin: 40px auto; display: grid; gap: 12px;">
    <h1>Login test</h1>

    <input
      v-model="email"
      type="email"
      placeholder="Email"
      autocomplete="email"
    />

    <input
      v-model="password"
      type="password"
      placeholder="Password"
      autocomplete="current-password"
    />

    <button :disabled="isLoading" @click="handleSignIn">
      Sign in
    </button>

    <button :disabled="isLoading" @click="handleGetSession">
      Get session
    </button>

    <button :disabled="isLoading" @click="handleSignOut">
      Sign out
    </button>

    <button :disabled="isLoading" @click="handleGetProfile">
      Get profile
    </button>

    <button :disabled="isLoading" @click="handleGetTimers">
      Get timers
    </button>

    <p>{{ message }}</p>
  </main>
</template>