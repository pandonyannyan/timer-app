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

async function handleGetBackendMe() {
  try {
    isLoading.value = true
    message.value = ''

    const session = await getCurrentSession()

    if (!session) {
      message.value = 'No active session'
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

    if (!apiBaseUrl) {
      message.value = 'VITE_API_BASE_URL is not set'
      return
    }

    const response = await fetch(`${apiBaseUrl}/me`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      message.value = `Backend /me failed: ${response.status} ${JSON.stringify(data)}`
      return
    }

    message.value = `Backend /me: ${data.email}, role: ${data.role}`
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleGetBackendTimers() {
  try {
    isLoading.value = true
    message.value = ''

    const session = await getCurrentSession()

    if (!session) {
      message.value = 'No active session'
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

    if (!apiBaseUrl) {
      message.value = 'VITE_API_BASE_URL is not set'
      return
    }

    const response = await fetch(`${apiBaseUrl}/timers`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      message.value = `Backend /timers failed: ${response.status} ${JSON.stringify(data)}`
      return
    }

    message.value = `Backend timers loaded: ${data.length}`
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleRestartBackendTimer() {
  try {
    isLoading.value = true
    message.value = ''

    const session = await getCurrentSession()

    if (!session) {
      message.value = 'No active session'
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

    if (!apiBaseUrl) {
      message.value = 'VITE_API_BASE_URL is not set'
      return
    }

    const timersResponse = await fetch(`${apiBaseUrl}/timers`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const timers = await timersResponse.json()

    if (!timersResponse.ok) {
      message.value = `Backend /timers failed: ${timersResponse.status} ${JSON.stringify(timers)}`
      return
    }

    if (!timers.length) {
      message.value = 'No timers to restart'
      return
    }

    const timerId = timers[0].id

    const response = await fetch(`${apiBaseUrl}/timers/${timerId}/restart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeShiftSeconds: 0,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      message.value = `Backend restart failed: ${response.status} ${JSON.stringify(data)}`
      return
    }

    message.value = `Backend timer restarted: ${data.title}, status: ${data.status}`
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

async function handleStopBackendTimer() {
  try {
    isLoading.value = true
    message.value = ''

    const session = await getCurrentSession()

    if (!session) {
      message.value = 'No active session'
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

    if (!apiBaseUrl) {
      message.value = 'VITE_API_BASE_URL is not set'
      return
    }

    const timersResponse = await fetch(`${apiBaseUrl}/timers`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const timers = await timersResponse.json()

    if (!timersResponse.ok) {
      message.value = `Backend /timers failed: ${timersResponse.status} ${JSON.stringify(timers)}`
      return
    }

    if (!timers.length) {
      message.value = 'No timers to stop'
      return
    }

    const timerId = timers[0].id

    const response = await fetch(`${apiBaseUrl}/timers/${timerId}/stop`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      message.value = `Backend stop failed: ${response.status} ${JSON.stringify(data)}`
      return
    }

    message.value = `Backend timer stopped: ${data.title}, status: ${data.status}`
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

    <button :disabled="isLoading" @click="handleGetBackendMe">
      Get backend /me
    </button>

    <button :disabled="isLoading" @click="handleGetBackendTimers">
      Get backend timers
    </button>

    <button :disabled="isLoading" @click="handleRestartBackendTimer">
      Restart backend timer
    </button>

    <button :disabled="isLoading" @click="handleStopBackendTimer">
      Stop backend timer
    </button>

    <p>{{ message }}</p>
  </main>
</template>
