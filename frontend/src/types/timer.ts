export type TimerStatus = 'active' | 'stopped'

export type TimerViewStatus =
  | 'active'
  | 'warning'
  | 'stopped'
  | 'signal'
  | 'completed'

export interface Timer {
  id: string
  title: string
  description: string
  imageUrl?: string
  durationSeconds: number
  minDurationSeconds: number | null
  timeShiftSeconds: number
  startedAt: string
  lastRunBy: string
  status: TimerStatus
  soundEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface TimerFormPayload {
  title: string
  description: string
  durationMinutes: number
  minDurationMinutes: number | null
  imageFile: File | null
  removeImage?: boolean
}