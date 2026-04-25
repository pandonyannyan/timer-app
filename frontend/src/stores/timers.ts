import { defineStore } from 'pinia'
import type { Timer } from '../types/timer'
import { removeCompletedTimer } from '../utils/completedTimers'

export const useTimersStore = defineStore('timers', {
  state: () => ({
    timers: [
      {
        id: '1',
        title: 'Почёсывание пупка',
        description: 'Почесать пупок пупочку',
        imageUrl: '',
        durationSeconds: 6000,
        timeShiftSeconds: 200,
        startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'active',
        soundEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Покрякать',
        description: 'Кря-кря-кря',
        imageUrl: '',
        durationSeconds: 10,
        timeShiftSeconds: 0,
        startedAt: new Date().toISOString(),
        status: 'active',
        soundEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Подождать',
        description: 'Просто ждать и ничего не делать',
        imageUrl: '',
        durationSeconds: 3600,
        timeShiftSeconds: 0,
        startedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        status: 'stopped',
        soundEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Просрачено',
        description: 'Тут у вас уже всё просрачено, можно не смотреть',
        imageUrl: '',
        durationSeconds: 10,
        timeShiftSeconds: 0,
        startedAt: new Date(Date.now() - 1000 * 60).toISOString(),
        status: 'active',
        soundEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as Timer[],
  }),

  actions: {
    restartTimer(timerId: string, timeShiftSeconds = 0) {
      const timer = this.timers.find(t => t.id === timerId)
      if (!timer) return

      timer.status = 'active'
      timer.startedAt = new Date().toISOString()
      timer.timeShiftSeconds = timeShiftSeconds
      timer.updatedAt = new Date().toISOString()

      // сбрасываем локальный completed
      removeCompletedTimer(timerId)
    },

    stopTimer(timerId: string) {
      const timer = this.timers.find(t => t.id === timerId)
      if (!timer) return

      timer.status = 'stopped'
      timer.updatedAt = new Date().toISOString()
    },
  },
})
