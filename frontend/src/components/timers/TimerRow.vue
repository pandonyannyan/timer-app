<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Timer, TimerFormPayload } from '../../types/timer'
import { addCompletedTimer } from '../../utils/completedTimers'
import {
  globalSoundEnabled,
  isSoundEnabled,
  toggleTimerSound,
} from '../../utils/soundSettings'
import { useTimerView } from '../../composables/useTimerView'
import { usePinnedTimers } from '../../composables/usePinnedTimers'
import { usePermissions } from '../../composables/usePermissions'
import signalSound from '../../assets/sounds/beep.mp3'
import warningSound from '../../assets/sounds/warning-beep.mp3'
import { useTimersStore } from '../../stores/timers'
import RestartTimerModal from './RestartTimerModal.vue'
import AddTimerModal from './AddTimerModal.vue'
import ConfirmDeleteModal from './ConfirmDeleteModal.vue'
import IconButton from '../ui/IconButton.vue'
import restartIcon from '../../assets/icons/restart.svg'
import stopIcon from '../../assets/icons/stop.svg'
import volumeOnIcon from '../../assets/icons/volume-on.svg'
import volumeOffIcon from '../../assets/icons/volume-off.svg'
import editIcon from '../../assets/icons/edit.svg'
import deleteIcon from '../../assets/icons/delete.svg'
import pinIcon from '../../assets/icons/pin.svg'
import pinFilledIcon from '../../assets/icons/pin-filled.svg'

const props = withDefaults(defineProps<{
  timer: Timer
  isReorderMode?: boolean
  isPinned?: boolean
  actionsDisabled?: boolean
}>(), {
  isReorderMode: false,
  isPinned: false,
  actionsDisabled: false,
})

const emit = defineEmits<{
  (e: 'togglePin'): void
}>()

const timersStore = useTimersStore()
const { removePinnedTimer } = usePinnedTimers()

const showRestartModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)

const {
  canEditTimer,
  canDeleteTimer,
} = usePermissions()

const {
  remaining,
  viewStatus,
  statusLabel,
  isMinDurationReached,
} = useTimerView(props.timer)

const signalAudio = new Audio(signalSound)
const warningAudio = new Audio(warningSound)

signalAudio.loop = false
warningAudio.loop = false

const hasPlayedSound = ref(false)
const hasPlayedWarningSound = ref(false)
const soundEnabled = ref(isSoundEnabled(props.timer.id))

const areActionsBlocked = computed(() => {
  return props.actionsDisabled || props.isReorderMode
})

const effectiveSoundEnabled = computed(() => {
  return globalSoundEnabled.value && soundEnabled.value
})

const soundButtonTitle = computed(() => {
  if (props.actionsDisabled) return 'Действия временно недоступны'
  if (props.isReorderMode) return 'Сначала сохраните порядок'

  if (!globalSoundEnabled.value) {
    return soundEnabled.value
      ? 'Общий звук выключен. Звук этого таймера включён'
      : 'Общий звук выключен. Звук этого таймера выключен'
  }

  return soundEnabled.value ? 'Выключить звук' : 'Включить звук'
})

const pinButtonTitle = computed(() => {
  if (props.actionsDisabled) return 'Действия временно недоступны'

  return props.isPinned ? 'Открепить таймер' : 'Закрепить таймер'
})

function stopAudio() {
  signalAudio.pause()
  signalAudio.currentTime = 0
}

function stopWarningAudio() {
  warningAudio.pause()
  warningAudio.currentTime = 0
}

function playSignalSound() {
  if (viewStatus.value !== 'signal') return
  if (!effectiveSoundEnabled.value) return
  if (hasPlayedSound.value) return

  signalAudio.currentTime = 0

  signalAudio.play().catch(() => {
    // Браузер может заблокировать звук, если пользователь ещё не кликал по странице
  })

  hasPlayedSound.value = true
}

function playWarningSound() {
  if (viewStatus.value !== 'warning') return
  if (!isMinDurationReached.value) return
  if (!effectiveSoundEnabled.value) return
  if (hasPlayedWarningSound.value) return

  warningAudio.currentTime = 0

  warningAudio.play().catch(() => {
    // Браузер может заблокировать звук, если пользователь ещё не кликал по странице
  })

  hasPlayedWarningSound.value = true
}

watch(viewStatus, () => {
  playWarningSound()
  playSignalSound()
})

watch(effectiveSoundEnabled, (enabled) => {
  if (!enabled) {
    stopAudio()
    stopWarningAudio()
    return
  }

  playWarningSound()
  playSignalSound()
})

const canStop = computed(() => {
  return viewStatus.value === 'active' || viewStatus.value === 'warning'
})

const durationLabel = computed(() => {
  const durationMinutes = Math.round(props.timer.durationSeconds / 60)

  if (props.timer.minDurationSeconds === null) {
    return `${durationMinutes} мин`
  }

  const minDurationMinutes = Math.round(props.timer.minDurationSeconds / 60)

  return `${minDurationMinutes}-${durationMinutes} мин`
})

const shiftMinutes = computed(() => {
  return Math.round(props.timer.timeShiftSeconds / 60)
})

const lastRunDate = computed(() => {
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(props.timer.startedAt))
})

const lastRunTime = computed(() => {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(props.timer.startedAt))
})

const stopButtonTitle = computed(() => {
  if (props.actionsDisabled) return 'Действия временно недоступны'
  if (props.isReorderMode) return 'Сначала сохраните порядок'
  if (!canStop.value) return 'Остановить можно только активный таймер'

  return 'Остановить'
})

const editButtonTitle = computed(() => {
  if (props.actionsDisabled) return 'Действия временно недоступны'
  if (props.isReorderMode) return 'Сначала сохраните порядок'
  if (!canEditTimer.value) return 'Недостаточно прав'

  return 'Редактировать'
})

const deleteButtonTitle = computed(() => {
  if (props.actionsDisabled) return 'Действия временно недоступны'
  if (props.isReorderMode) return 'Сначала сохраните порядок'
  if (!canDeleteTimer.value) return 'Недостаточно прав'

  return 'Удалить'
})

function formatTime(sec: number) {
  const s = Math.max(sec, 0)

  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const secLeft = s % 60

  return [h, m, secLeft]
    .map(v => String(v).padStart(2, '0'))
    .join(':')
}

function completeTimer() {
  if (areActionsBlocked.value) return

  stopAudio()
  stopWarningAudio()

  addCompletedTimer(props.timer.id, props.timer.startedAt)
}

function togglePin() {
  if (areActionsBlocked.value) return

  emit('togglePin')
}

function toggleSound() {
  if (areActionsBlocked.value) return

  soundEnabled.value = toggleTimerSound(props.timer.id)

  if (!soundEnabled.value) {
    stopAudio()
  }
}

function openRestartModal() {
  if (areActionsBlocked.value) return

  showRestartModal.value = true
  blurActiveElement()
}

async function handleRestart(timeShiftSeconds: number) {
  try {
    await timersStore.restartTimer(props.timer.id, timeShiftSeconds)

    hasPlayedSound.value = false
    hasPlayedWarningSound.value = false
    stopAudio()
    stopWarningAudio()

    closeRestartModal()
  } catch (error) {
    console.error('Failed to restart timer', error)
  }
}

function blurActiveElement() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function closeRestartModal() {
  showRestartModal.value = false
  blurActiveElement()
}

function closeEditModal() {
  showEditModal.value = false
  blurActiveElement()
}

function closeDeleteModal() {
  showDeleteModal.value = false
  blurActiveElement()
}

async function stopTimer() {
  if (areActionsBlocked.value) return

  try {
    await timersStore.stopTimer(props.timer.id)

    stopAudio()
    stopWarningAudio()
  } catch (error) {
    console.error('Failed to stop timer', error)
  }
}

function openEditModal() {
  if (areActionsBlocked.value) return
  if (!canEditTimer.value) return

  showEditModal.value = true
  blurActiveElement()
}

async function handleUpdateTimer(payload: TimerFormPayload) {
  if (areActionsBlocked.value) return

  try {
    await timersStore.updateTimer(props.timer.id, payload)

    closeEditModal()
  } catch (error) {
    console.error('Failed to update timer', error)
  }
}

function openDeleteModal() {
  if (areActionsBlocked.value) return
  if (!canDeleteTimer.value) return

  showDeleteModal.value = true
  blurActiveElement()
}

async function handleDeleteTimer() {
  if (areActionsBlocked.value) return

  try {
    stopAudio()
    stopWarningAudio()

    await timersStore.deleteTimer(props.timer.id)

    removePinnedTimer(props.timer.id)
    closeDeleteModal()
  } catch (error) {
    console.error('Failed to delete timer', error)
  }
}
</script>

<template>
  <div
    :class="[
      'row',
      {
        highlighted: viewStatus === 'signal',
        warning: viewStatus === 'warning',
      },
    ]"
  > 
    <div class="pin-cell">
      <span
        v-if="isReorderMode"
        class="drag-handle"
        title="Перетащите, чтобы изменить порядок"
        aria-hidden="true"
      >
        ⋮⋮
      </span>

      <button
        v-else
        class="pin-button"
        :class="{ 'pin-button--active': isPinned }"
        type="button"
        :disabled="actionsDisabled"
        :title="pinButtonTitle"
        :aria-label="pinButtonTitle"
        @click="togglePin"
      >
        <img
          class="pin-icon"
          :src="isPinned ? pinFilledIcon : pinIcon"
          alt=""
        >
      </button>
    </div>

    <div class="name">
      <div class="timer-image">
        <img
          v-if="timer.imageUrl"
          :src="timer.imageUrl"
          :alt="timer.title"
        >

        <span v-else class="timer-image-placeholder">
          {{ timer.title.charAt(0).toUpperCase() }}
        </span>
      </div>

      <span class="timer-title" :title="timer.title">{{ timer.title }}</span>
    </div>

    <div>
      <span :class="['status', viewStatus]">
        {{ statusLabel }}
      </span>
    </div>

    <div class="desc" :title="timer.description">
      {{ timer.description }}
    </div>

    <div class="duration">
      {{ durationLabel }}
    </div>

    <div class="time">
      {{ viewStatus === 'stopped' ? '00:00:00' : formatTime(remaining) }}
    </div>

    <div class="last-run">
      <div class="last-run-main">
        <span>{{ lastRunDate }}</span>
        <span>{{ lastRunTime }}</span>
        <span v-if="shiftMinutes > 0" class="shift">
          delay {{ shiftMinutes }} мин
        </span>
      </div>
      <div class="user">{{ timer.lastRunByDisplayName || 'Без имени' }}</div>
    </div>

    <div class="actions">
      <button
        v-if="viewStatus === 'signal'"
        class="complete-btn"
      :disabled="areActionsBlocked"
      :title="actionsDisabled ? 'Действия временно недоступны' : isReorderMode ? 'Сначала сохраните порядок' : 'Завершить'"
        @click="completeTimer"
      >
        Завершить
      </button>

      <template v-else>
        <IconButton
          :title="actionsDisabled ? 'Действия временно недоступны' : isReorderMode ? 'Сначала сохраните порядок' : 'Перезапустить'"
          :disabled="areActionsBlocked"
          @click="openRestartModal"
        >
          <img :src="restartIcon" alt="restart">
        </IconButton>

        <IconButton
          class="action-button"
          :disabled="areActionsBlocked || !canStop"
          :title="stopButtonTitle"
          @click="stopTimer"
        >
          <img :src="stopIcon" alt="stop">
        </IconButton>

        <IconButton
          :disabled="areActionsBlocked"
          :title="soundButtonTitle"
          @click="toggleSound"
        >
          <img
            :src="soundEnabled ? volumeOnIcon : volumeOffIcon"
            alt="sound"
          >
        </IconButton>

        <IconButton
          :disabled="areActionsBlocked || !canEditTimer"
          :title="editButtonTitle"
          @click="openEditModal"
        >
          <img :src="editIcon" alt="edit">
        </IconButton>

        <IconButton
          :disabled="areActionsBlocked || !canDeleteTimer"
          :title="deleteButtonTitle"
          @click="openDeleteModal"
        >
          <img :src="deleteIcon" alt="delete">
        </IconButton>
      </template>
    </div>
  </div>

  <RestartTimerModal
    v-if="showRestartModal"
    :duration-seconds="timer.durationSeconds"
    @close="closeRestartModal"
    @submit="handleRestart"
  />

  <AddTimerModal
    v-if="showEditModal"
    mode="edit"
    :timer="timer"
    @close="closeEditModal"
    @submit="handleUpdateTimer"
  />

  <ConfirmDeleteModal
    v-if="showDeleteModal"
    :timer-title="timer.title"
    @close="closeDeleteModal"
    @confirm="handleDeleteTimer"
  />
</template>

<style scoped>
.row {
  position: relative;

  display: grid;
  grid-template-columns: var(--timers-grid-columns);
  align-items: center;
  gap: var(--timers-grid-gap);

  background: white;
  border-radius: 16px;
  padding: 18px 16px;
  margin-bottom: 10px;

  min-height: 86px;
  border: 1px solid transparent;
  font-size: 14px;

  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.row:hover {
  background: #f8fafc;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.row.highlighted {
  border-color: #6f89ad;
  background: #f9fbff;
}

.row.warning {
  border-color: #b8a985;
  background: #f9fbff;
}

.pin-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.pin-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;
  padding: 0;

  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.1s ease;
}

.pin-button:hover {
  background: #eef3f7;
  border-color: #d5dde8;
  color: #6f89ad;
}

.pin-button:active {
  transform: scale(0.96);
}

.pin-button:focus-visible {
  outline: 2px solid #6f89ad;
  outline-offset: 2px;
}

.pin-button--active {
  color: #6f89ad;
  background: #eef3f7;
  border-color: #d5dde8;
}

.pin-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pin-button:disabled:hover {
  background: transparent;
  border-color: transparent;
  color: #9ca3af;
}

.pin-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 34px;
  height: 34px;

  color: #9ca3af;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -5px;
  cursor: grab;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.timer-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  line-height: 1.25;
}

.timer-image {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;
  background: #edf1f5;
  overflow: hidden;
}

.timer-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
}

.timer-image-placeholder {
  color: #6f89ad;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
}

.status {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 14px;
  line-height: 1;
  border: 1px solid transparent;
}

.status.active {
  color: #5f8f72;
  border-color: #8db59d;
  background: #eef8f1;
}

.status.stopped {
  color: #6b7280;
  border-color: #cfd5dd;
  background: #f3f4f6;
}

.status.warning {
  color: #8c7755;
  border-color: #b8a985;
  background: #fbf5e8;
}

.status.signal {
  color: #b16969;
  border-color: #cb8d8d;
  background: #fff1f1;
}

.status.completed {
  color: #6d87ad;
  border-color: #8ea8cc;
  background: #eef5ff;
}

.desc {
  color: #111827;
  line-height: 1.25;
  min-width: 0;
  font-size: 14px;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;

  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-weight: 700;
  font-size: 16px;
  text-align: left;
}

.last-run {
  font-size: 13px;
  line-height: 1.25;
  min-width: 0;
}

.last-run-main {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.shift {
  color: #9ca3af;
  font-size: 12px;
}

.user {
  margin-top: 4px;
  color: #a0a7b4;
  font-size: 13px;
}

.actions {
  --action-button-size: 34px;
  --action-buttons-count: 5;
  --action-gap: 6px;
  --actions-width: calc(
    var(--action-button-size) * var(--action-buttons-count) +
    var(--action-gap) * (var(--action-buttons-count) - 1)
  );

  display: flex;
  align-items: center;
  gap: var(--action-gap);
  justify-content: flex-start;
  flex-wrap: nowrap;

  width: var(--actions-width);
}

.complete-btn {
  width: 100%;
  height: 36px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: #6f89ad;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.complete-btn:hover {
  background: #5f7a9f;
}

.complete-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.complete-btn:disabled {
  background: #6f89ad;
  color: #ffffff;
  opacity: 0.45;
  cursor: not-allowed;
}

.complete-btn:disabled:hover {
  background: #6f89ad;
}

.duration {
  white-space: nowrap;
}

@container (max-width: 1400px) {
  .row {
    font-size: 14px;
    grid-template-columns: 34px 1fr auto;
    grid-template-areas:
      "pin name status"
      "pin desc desc"
      "pin duration duration"
      "pin time time"
      "pin last-run last-run"
      "pin actions actions";

    gap: 12px 14px;
    align-items: start;

    padding: 16px;
    min-height: auto;
  }

  .pin-cell {
    grid-area: pin;
    align-self: start;
  }

  .name {
    grid-area: name;
  }

  .row > div:nth-child(3) {
    grid-area: status;
    justify-self: end;
  }

  .desc {
    grid-area: desc;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  .duration {
    grid-area: duration;
  }

  .duration::before {
    content: "Длительность: ";
    color: #6b7280;
    font-weight: 400;
  }

  .time {
    grid-area: time;
  }

  .time::before {
    content: "Осталось: ";
    color: #6b7280;
    font-weight: 400;
  }

  .last-run {
    grid-area: last-run;
  }

  .last-run::before {
    content: "Последний запуск: ";
    display: block;
    margin-bottom: 4px;
    color: #6b7280;
    font-size: 13px;
  }

  .last-run-main {
    flex-wrap: wrap;
    gap: 6px;
    white-space: normal;
  }

  .actions {
    grid-area: actions;
    justify-self: stretch;
    justify-content: flex-end;
    width: 100%;
    padding-top: 4px;
  }

  .desc,
  .duration,
  .last-run,
  .user {
    font-size: 14px;
  }

  .time {
    font-size: 15px;
  }
}
</style>