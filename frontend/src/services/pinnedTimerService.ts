const STORAGE_KEY = 'timer-app:pinned-timer-ids'

function loadPinnedTimerIds(): string[] {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)

    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

function savePinnedTimerIds(timerIds: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timerIds))
}

function getPinnedTimers(): string[] {
  return loadPinnedTimerIds()
}

function pinTimer(timerId: string): string[] {
  const timerIds = loadPinnedTimerIds()

  if (timerIds.includes(timerId)) {
    return timerIds
  }

  const nextTimerIds = [...timerIds, timerId]

  savePinnedTimerIds(nextTimerIds)

  return nextTimerIds
}

function unpinTimer(timerId: string): string[] {
  const nextTimerIds = loadPinnedTimerIds().filter((id) => id !== timerId)

  savePinnedTimerIds(nextTimerIds)

  return nextTimerIds
}

function reorderPinnedTimers(timerIds: string[]): string[] {
  const nextTimerIds = [...timerIds]

  savePinnedTimerIds(nextTimerIds)

  return nextTimerIds
}

function removePinnedTimer(timerId: string): string[] {
  return unpinTimer(timerId)
}

export const pinnedTimerService = {
  getPinnedTimers,
  pinTimer,
  unpinTimer,
  reorderPinnedTimers,
  removePinnedTimer,
}