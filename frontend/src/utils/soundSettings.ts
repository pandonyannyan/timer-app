const KEY = 'timer_sound_disabled_ids'

export function getSoundDisabledTimers(): string[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

export function isSoundEnabled(timerId: string): boolean {
  return !getSoundDisabledTimers().includes(timerId)
}

export function toggleTimerSound(timerId: string): boolean {
  const disabledIds = getSoundDisabledTimers()
  const isDisabled = disabledIds.includes(timerId)

  const nextDisabledIds = isDisabled
    ? disabledIds.filter(id => id !== timerId)
    : [...disabledIds, timerId]

  localStorage.setItem(KEY, JSON.stringify(nextDisabledIds))

  return isDisabled
}
