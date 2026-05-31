import type { Timer, TimerFormPayload } from '../types/timer'
import { getCurrentSession } from './authService'

const toSecondsOrNull = (minutes: number | null): number | null => {
  return minutes === null ? null : minutes * 60
}

const getApiConfig = async () => {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('No active session')
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  return {
    apiBaseUrl,
    accessToken: session.access_token,
  }
}

const getTimers = async (): Promise<Timer[]> => {
  const { apiBaseUrl, accessToken } = await getApiConfig()

  const response = await fetch(`${apiBaseUrl}/timers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to load timers: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

const createTimer = async (payload: TimerFormPayload): Promise<Timer> => {
  const { apiBaseUrl, accessToken } = await getApiConfig()

  const response = await fetch(`${apiBaseUrl}/timers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      imageUrl: null,
      durationSeconds: payload.durationMinutes * 60,
      minDurationSeconds: toSecondsOrNull(payload.minDurationMinutes),
      timeShiftSeconds: 0,
      soundEnabled: true,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to create timer: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

const updateTimer = async (
  timerId: string,
  payload: TimerFormPayload,
): Promise<Timer | null> => {
  const { apiBaseUrl, accessToken } = await getApiConfig()

  const response = await fetch(`${apiBaseUrl}/timers/${timerId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      imageUrl: payload.removeImage ? null : undefined,
      durationSeconds: payload.durationMinutes * 60,
      minDurationSeconds: toSecondsOrNull(payload.minDurationMinutes),
    }),
  })

  const data = await response.json()

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to update timer: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

const deleteTimer = async (timerId: string): Promise<boolean> => {
  const { apiBaseUrl, accessToken } = await getApiConfig()

  const response = await fetch(`${apiBaseUrl}/timers/${timerId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 404) {
    return false
  }

  if (!response.ok) {
    let errorDetails = ''

    try {
      errorDetails = JSON.stringify(await response.json())
    } catch {
      errorDetails = response.statusText
    }

    throw new Error(`Failed to delete timer: ${response.status} ${errorDetails}`)
  }

  return true
}

const restartTimer = async (
  timerId: string,
  timeShiftSeconds = 0,
): Promise<Timer | null> => {
  const { apiBaseUrl, accessToken } = await getApiConfig()

  const response = await fetch(`${apiBaseUrl}/timers/${timerId}/restart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeShiftSeconds,
    }),
  })

  const data = await response.json()

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to restart timer: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

const stopTimer = async (
  timerId: string,
): Promise<Timer | null> => {
  const { apiBaseUrl, accessToken } = await getApiConfig()

  const response = await fetch(`${apiBaseUrl}/timers/${timerId}/stop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const data = await response.json()

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to stop timer: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

export const timerService = {
  getTimers,
  createTimer,
  updateTimer,
  deleteTimer,
  restartTimer,
  stopTimer,
}