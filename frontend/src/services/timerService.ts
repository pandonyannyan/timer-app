import type { Timer, TimerFormPayload } from '../types/timer'

import timerImage1 from '../assets/timer-images/img1.jpg'
import timerImage2 from '../assets/timer-images/img2.jpg'
import timerImage3 from '../assets/timer-images/img3.jpg'
import timerImage4 from '../assets/timer-images/img4.gif'

const MOCK_CURRENT_USER_NAME = 'Pupok Pupochkov'

const mockTimers: Timer[] = [
  {
    id: '1',
    title: 'Почёсывание пупка непочёсанному пупочку (очень длинное название таймера)',
    description: 'Почесать пупок пупочку. Не просто почесать, а так почесать, чтоб всем стало хорошо. И пупочку, и жопучке, и соседским пёськам, и афганским дроздам. Кстати, раз это очень длинное описание - сюда можно написать всякую ерунду. Например разберёмся, почему котлеты вкусные. Они вкусные благодаря сочетанию сочного мясного фарша (часто свино-говяжьего), обжариванию до хрустящей корочки и добавлению компонентов, удерживающих влагу (хлеб, лук, ледяная вода). Правильный баланс жиров и специй создает насыщенный вкус, а «отбивание» фарша делает их нежными.',
    imageUrl: timerImage1,
    durationSeconds: 6000,
    timeShiftSeconds: 200,
    startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Покрякать',
    description: 'Кря-кря-кря',
    imageUrl: timerImage2,
    durationSeconds: 10,
    timeShiftSeconds: 0,
    startedAt: new Date().toISOString(),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Подождать',
    description: 'Просто ждать и ничего не делать',
    imageUrl: timerImage3,
    durationSeconds: 3600,
    timeShiftSeconds: 0,
    startedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'stopped',
    soundEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Просрачено',
    description: 'Тут у вас уже всё просрачено, можно не смотреть',
    imageUrl: timerImage4,
    durationSeconds: 10,
    timeShiftSeconds: 0,
    startedAt: new Date(Date.now() - 1000 * 60).toISOString(),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'active',
    soundEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Заглушка',
    description: 'Просто заглушка',
    imageUrl: '',
    durationSeconds: 60,
    timeShiftSeconds: 0,
    startedAt: new Date().toISOString(),
    lastRunBy: MOCK_CURRENT_USER_NAME,
    status: 'stopped',
    soundEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const cloneTimer = (timer: Timer): Timer => {
  return { ...timer }
}

const getTimers = (): Timer[] => {
  return mockTimers.map(cloneTimer)
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