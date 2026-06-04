import { defineStore } from 'pinia'
import type { Timer, TimerFormPayload } from '../types/timer'
import { timerService } from '../services/timerService'
import { removeCompletedTimer } from '../utils/completedTimers'

interface TimersState {
  timers: Timer[]
  isLoading: boolean
  isActionPending: boolean
  error: string | null
  actionError: string | null
}

export const useTimersStore = defineStore('timers', {
  state: (): TimersState => ({
    timers: [],
    isLoading: false,
    isActionPending: false,
    error: null,
    actionError: null,
  }),

  actions: {
    async loadTimers() {
      try {
        this.isLoading = true
        this.error = null

        this.timers = await timerService.getTimers()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load timers'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async runTimerAction(
      action: () => Promise<void>,
      fallbackMessage = 'Failed to perform timer action',
    ) {
      if (this.isActionPending) return

      try {
        this.isActionPending = true
        this.actionError = null

        await action()
      } catch (error) {
        this.actionError = error instanceof Error ? error.message : fallbackMessage
        throw error
      } finally {
        this.isActionPending = false
      }
    },

    async createTimer(payload: TimerFormPayload) {
      await this.runTimerAction(async () => {
        const timer = await timerService.createTimer(payload)

        this.timers.unshift(timer)
      }, 'Failed to create timer')
    },

    async updateTimer(timerId: string, payload: TimerFormPayload) {
      await this.runTimerAction(async () => {
        const updatedTimer = await timerService.updateTimer(timerId, payload)

        if (!updatedTimer) {
          throw new Error('Timer was not updated')
        }

        const timerIndex = this.timers.findIndex(timer => timer.id === timerId)

        if (timerIndex === -1) {
          throw new Error('Updated timer was not found in local state')
        }

        Object.assign(this.timers[timerIndex], updatedTimer)
      }, 'Failed to update timer')
    },

    async deleteTimer(timerId: string) {
      await this.runTimerAction(async () => {
        const isDeleted = await timerService.deleteTimer(timerId)

        if (!isDeleted) {
          throw new Error('Timer was not deleted')
        }

        removeCompletedTimer(timerId)

        this.timers = this.timers.filter(timer => timer.id !== timerId)
      }, 'Failed to delete timer')
    },

    async restartTimer(timerId: string, timeShiftSeconds = 0) {
      await this.runTimerAction(async () => {
        const updatedTimer = await timerService.restartTimer(timerId, timeShiftSeconds)

        if (!updatedTimer) {
          throw new Error('Timer was not restarted')
        }

        removeCompletedTimer(timerId)

        const timerIndex = this.timers.findIndex(timer => timer.id === timerId)

        if (timerIndex === -1) {
          throw new Error('Restarted timer was not found in local state')
        }

        Object.assign(this.timers[timerIndex], updatedTimer)
      }, 'Failed to restart timer')
    },

    async stopTimer(timerId: string) {
      await this.runTimerAction(async () => {
        const updatedTimer = await timerService.stopTimer(timerId)

        if (!updatedTimer) {
          throw new Error('Timer was not stopped')
        }

        const timerIndex = this.timers.findIndex(timer => timer.id === timerId)

        if (timerIndex === -1) {
          throw new Error('Stopped timer was not found in local state')
        }

        Object.assign(this.timers[timerIndex], updatedTimer)
      }, 'Failed to stop timer')
    },

    clearActionError() {
      this.actionError = null
    },

    clearError() {
      this.error = null
    },
  },
})