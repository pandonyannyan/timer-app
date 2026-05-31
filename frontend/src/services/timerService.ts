import type { Timer, TimerFormPayload } from '../types/timer'
import { getCurrentSession } from './authService'

import timerImage1 from '../assets/timer-images/img1.jpg'
import timerImage2 from '../assets/timer-images/img2.jpg'
import timerImage3 from '../assets/timer-images/img3.jpg'
import timerImage4 from '../assets/timer-images/img4.gif'

const MOCK_CURRENT_USER_NAME = 'Pupok Pupochkov'

const toSecondsOrNull = (minutes: number | null): number | null => {
  return minutes === null ? null : minutes * 60
}

const now = Date.now()
const iso = (offsetSeconds = 0) => {
  return new Date(now + offsetSeconds * 1000).toISOString()
}

const mockTimers: Timer[] = [
  {
    id: '1',
    title: 'Обычный активный таймер',
    description: 'Таймер без минимальной длительности. Должен быть в статусе Активен.',
    imageUrl: timerImage1,
    durationSeconds: 60 * 100,
    minDurationSeconds: null,
    timeShiftSeconds: 0,
    startedAt: iso(-60 * 10),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: iso(),
    updatedAt: iso(),
  },
  {
    id: '2',
    title: 'Диапазон до warning',
    description: 'Таймер с диапазоном 80-100 минут. Минимальная длительность ещё не наступила.',
    imageUrl: timerImage2,
    durationSeconds: 60 * 100,
    minDurationSeconds: 60 * 80,
    timeShiftSeconds: 0,
    startedAt: iso(-60 * 10),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: iso(),
    updatedAt: iso(),
  },
  {
    id: '3',
    title: 'Диапазон в warning',
    description: 'Минимальная длительность уже наступила, но полная ещё нет. Должен быть статус Внимание.',
    imageUrl: timerImage3,
    durationSeconds: 60 * 100,
    minDurationSeconds: 60 * 80,
    timeShiftSeconds: 0,
    startedAt: iso(-60 * 85),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: iso(),
    updatedAt: iso(),
  },
  {
    id: '4',
    title: 'Скоро финальный сигнал',
    description: 'Короткий таймер для проверки перехода из warning в signal.',
    imageUrl: timerImage4,
    durationSeconds: 60,
    minDurationSeconds: 30,
    timeShiftSeconds: 0,
    startedAt: iso(-45),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: iso(),
    updatedAt: iso(),
  },
  {
    id: '5',
    title: 'Уже завершённый при открытии',
    description: 'Таймер истёк до открытия страницы. Должен отображаться как Завершён.',
    imageUrl: '',
    durationSeconds: 60,
    minDurationSeconds: 30,
    timeShiftSeconds: 0,
    startedAt: iso(-60 * 5),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: false,
    createdAt: iso(),
    updatedAt: iso(),
  },
  {
    id: '6',
    title: 'Остановленный таймер',
    description: 'Остановленный таймер с диапазоном. Должен быть серым и показывать 00:00:00.',
    imageUrl: '',
    durationSeconds: 60 * 120,
    minDurationSeconds: 60 * 100,
    timeShiftSeconds: 0,
    startedAt: iso(-60 * 30),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'stopped',
    soundEnabled: false,
    createdAt: iso(),
    updatedAt: iso(),
  },
]

const cloneTimer = (timer: Timer): Timer => {
  return { ...timer }
}

const getTimers = async (): Promise<Timer[]> => {
  const session = await getCurrentSession()

  if (!session) {
    throw new Error('No active session')
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  const response = await fetch(`${apiBaseUrl}/timers`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to load timers: ${response.status} ${JSON.stringify(data)}`)
  }

  return data
}

const createTimer = (payload: TimerFormPayload): Timer => {
  const now = new Date().toISOString()

  const imageUrl = payload.imageFile
    ? URL.createObjectURL(payload.imageFile)
    : undefined

  const timer: Timer = {
    id: crypto.randomUUID(),
    title: payload.title,
    description: payload.description,
    imageUrl,
    durationSeconds: payload.durationMinutes * 60,
    minDurationSeconds: toSecondsOrNull(payload.minDurationMinutes),
    timeShiftSeconds: 0,
    startedAt: now,
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: now,
    updatedAt: now,
  }

  mockTimers.unshift(timer)

  return cloneTimer(timer)
}

const updateTimer = (
  timerId: string,
  payload: TimerFormPayload,
): Timer | null => {
  const timer = mockTimers.find(timer => timer.id === timerId)

  if (!timer) {
    return null
  }

  timer.title = payload.title
  timer.description = payload.description
  timer.durationSeconds = payload.durationMinutes * 60
  timer.minDurationSeconds = toSecondsOrNull(payload.minDurationMinutes)
  timer.updatedAt = new Date().toISOString()

  if (payload.removeImage) {
    timer.imageUrl = undefined
  } else if (payload.imageFile) {
    timer.imageUrl = URL.createObjectURL(payload.imageFile)
  }

  return cloneTimer(timer)
}

const deleteTimer = (timerId: string): boolean => {
  const timerIndex = mockTimers.findIndex(timer => timer.id === timerId)

  if (timerIndex === -1) {
    return false
  }

  mockTimers.splice(timerIndex, 1)

  return true
}

const restartTimer = (
  timerId: string,
  timeShiftSeconds = 0,
): Timer | null => {
  const timer = mockTimers.find(timer => timer.id === timerId)

  if (!timer) {
    return null
  }

  const now = new Date().toISOString()

  timer.status = 'active'
  timer.startedAt = now
  timer.lastRunBy = MOCK_CURRENT_USER_NAME
  timer.timeShiftSeconds = timeShiftSeconds
  timer.updatedAt = now

  return cloneTimer(timer)
}

const stopTimer = (timerId: string): Timer | null => {
  const timer = mockTimers.find(timer => timer.id === timerId)

  if (!timer) {
    return null
  }

  timer.status = 'stopped'
  timer.updatedAt = new Date().toISOString()

  return cloneTimer(timer)
}

export const timerService = {
  getTimers,
  createTimer,
  updateTimer,
  deleteTimer,
  restartTimer,
  stopTimer,
}