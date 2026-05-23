import { computed, onMounted, ref } from 'vue'
import type { Timer, TimerViewStatus } from '../types/timer'
import { useNow } from '../utils/useNow'
import { isTimerCompleted } from '../utils/completedTimers'

export function useTimerView(timer: Timer) {
  const { now } = useNow()
  const wasExpiredOnMount = ref(false)

  const effectiveDuration = computed(() => {
    return timer.durationSeconds - timer.timeShiftSeconds
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

  onMounted(() => {
    const finishedAt = startedAtMs.value + effectiveDuration.value * 1000

    wasExpiredOnMount.value = finishedAt <= Date.now()
  })

  const viewStatus = computed<TimerViewStatus>(() => {
    if (timer.status === 'stopped') return 'stopped'

    if (remaining.value <= 0) {
      if (wasExpiredOnMount.value) {
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
    elapsed,
    remaining,
    viewStatus,
    statusLabel,
  }
}
