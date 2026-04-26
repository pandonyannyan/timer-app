import { defineStore } from 'pinia'
import type { Timer } from '../types/timer'
import { removeCompletedTimer } from '../utils/completedTimers'

import timerImage1 from '../assets/timer-images/img1.jpg'
import timerImage2 from '../assets/timer-images/img2.jpg'
import timerImage3 from '../assets/timer-images/img3.jpg'
import timerImage4 from '../assets/timer-images/img4.gif'

export const useTimersStore = defineStore('timers', {
  state: () => ({
    timers: [
      {
        id: '1',
        title: 'Почёсывание пупка непочёсанному пупочку (очень длинное название таймера)',
        description: 'Почесать пупок пупочку. Не просто почесать, а так почесать, чтоб всем стало хорошо. И пупочку, и жопучке, и соседским пёськам, и афганским дроздам. Кстати, раз это очень длинное описание - сюда можно написать всякую ерунду. Например разберёмся, почему котлеты вкусные. Они вкусные благодаря сочетанию сочного мясного фарша (часто свино-говяжьего), обжариванию до хрустящей корочки и добавлению компонентов, удерживающих влагу (хлеб, лук, ледяная вода). Правильный баланс жиров и специй создает насыщенный вкус, а «отбивание» фарша делает их нежными.',
        imageUrl: timerImage1,
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
        imageUrl: timerImage2,
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
        imageUrl: timerImage3,
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
        imageUrl: timerImage4,
        durationSeconds: 10,
        timeShiftSeconds: 0,
        startedAt: new Date(Date.now() - 1000 * 60).toISOString(),
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
        status: 'stopped',
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
