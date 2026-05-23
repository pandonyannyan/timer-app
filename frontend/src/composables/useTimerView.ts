import { computed } from 'vue'
import type { Timer, TimerViewStatus } from '../types/timer'
import { useNow } from '../utils/useNow'
import { isTimerCompleted } from '../utils/completedTimers'

export function useTimerView(timer: Timer) {
  const { now } = useNow()
  const mountedAt = Date.now()

  const effectiveDuration = computed(() => {
    return Math.max(0, timer.durationSeconds - timer.timeShiftSeconds)
  })

  const effectiveMinDuration = computed(() => {
    if (timer.minDurationSeconds === null) return null

    return Math.max(0, timer.minDurationSeconds - timer.timeShiftSeconds)
  })

  const startedAtMs = computed(() => {
    return new Date(timer.startedAt).getTime()
  })

  const elapsed = computed(() => {
    return Math.floor((now.value - startedAtMs.value) / 1000)
  })

  const remaining = computed(() => {
    return effectiveDuration.value - elapsed.value
  })

  const isMinDurationReached = computed(() => {
    if (timer.status === 'stopped') return false
    if (effectiveMinDuration.value === null) return false

    return (
      elapsed.value >= effectiveMinDuration.value &&
      elapsed.value < effectiveDuration.value
    )
  })

  const viewStatus = computed<TimerViewStatus>(() => {
    if (timer.status === 'stopped') return 'stopped'

    if (remaining.value <= 0) {
      const finishedAt = startedAtMs.value + effectiveDuration.value * 1000

      if (startedAtMs.value < mountedAt && finishedAt <= mountedAt) {
        return 'completed'
      }

      if (isTimerCompleted(timer.id, timer.startedAt)) {
        return 'completed'
      }

      return 'signal'
    }

    return 'active'
  })

  const statusLabel = computed(() => {
    const labels: Record<TimerViewStatus, string> = {
      active: 'Активен',
      stopped: 'Остановлен',
      signal: 'Сигнал',
      completed: 'Завершён',
    }

    return labels[viewStatus.value]
  })

  return {
    effectiveDuration,
    effectiveMinDuration,
    elapsed,
    remaining,
    isMinDurationReached,
    viewStatus,
    statusLabel,
  }
}