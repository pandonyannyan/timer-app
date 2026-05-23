const KEY = 'completed_signal_timer_ids'

function getTimerRunKey(id: string, startedAt: string) {
  return `${id}:${startedAt}`
}

export function getCompletedTimers(): string[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

export function addCompletedTimer(id: string, startedAt: string) {
  const key = getTimerRunKey(id, startedAt)
  const list = getCompletedTimers()

  if (!list.includes(key)) {
    list.push(key)
    localStorage.setItem(KEY, JSON.stringify(list))
  }
}

export function removeCompletedTimer(id: string) {
  const list = getCompletedTimers()

  localStorage.setItem(
    KEY,
    JSON.stringify(
      list.filter(item => item !== id && !item.startsWith(`${id}:`)),
    ),
  )
}

export function isTimerCompleted(id: string, startedAt: string): boolean {
  const key = getTimerRunKey(id, startedAt)

  return getCompletedTimers().includes(key)
}