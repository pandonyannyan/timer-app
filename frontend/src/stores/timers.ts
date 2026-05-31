import { defineStore } from 'pinia'
import type { Timer, TimerFormPayload } from '../types/timer'
import { timerService } from '../services/timerService'
import { removeCompletedTimer } from '../utils/completedTimers'

export const useTimersStore = defineStore('timers', {
  state: () => ({
    timers: [] as Timer[],
  }),

 actions: {
    async loadTimers() {
      this.timers = await timerService.getTimers()
    },

    async createTimer(payload: TimerFormPayload) {
      const timer = await timerService.createTimer(payload)

      this.timers.unshift(timer)
    },

    async updateTimer(timerId: string, payload: TimerFormPayload) {
      const updatedTimer = await timerService.updateTimer(timerId, payload)

      if (!updatedTimer) {
        return
      }

      const timerIndex = this.timers.findIndex(timer => timer.id === timerId)

      if (timerIndex === -1) {
        return
      }

      Object.assign(this.timers[timerIndex], updatedTimer)
    },

    async deleteTimer(timerId: string) {
      const isDeleted = await timerService.deleteTimer(timerId)

      if (!isDeleted) {
        return
      }

      removeCompletedTimer(timerId)

      this.timers = this.timers.filter(timer => timer.id !== timerId)
    },

    async restartTimer(timerId: string, timeShiftSeconds = 0) {
      const updatedTimer = await timerService.restartTimer(timerId, timeShiftSeconds)

      if (!updatedTimer) {
        return
      }

      removeCompletedTimer(timerId)

      const timerIndex = this.timers.findIndex(timer => timer.id === timerId)

      if (timerIndex === -1) {
        return
      }

      Object.assign(this.timers[timerIndex], updatedTimer)
    },

    async stopTimer(timerId: string) {
      const updatedTimer = await timerService.stopTimer(timerId)

      if (!updatedTimer) {
        return
      }

      const timerIndex = this.timers.findIndex(timer => timer.id === timerId)

      if (timerIndex === -1) {
        return
      }

      Object.assign(this.timers[timerIndex], updatedTimer)
    },
  },
})