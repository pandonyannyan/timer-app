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
import { usePermissions } from '../../composables/usePermissions'
import beepSound from '../../assets/sounds/beep.mp3'
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

const props = withDefaults(defineProps<{
  timer: Timer
  isReorderMode?: boolean
}>(), {
  isReorderMode: false,
})

const timersStore = useTimersStore()
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
} = useTimerView(props.timer)

const audio = new Audio(beepSound)
const hasPlayedSound = ref(false)
const soundEnabled = ref(isSoundEnabled(props.timer.id))

const effectiveSoundEnabled = computed(() => {
  return globalSoundEnabled.value && soundEnabled.value
})

const soundButtonTitle = computed(() => {
  if (props.isReorderMode) return 'Сначала сохраните порядок'

  if (!globalSoundEnabled.value) {
    return soundEnabled.value
      ? 'Общий звук выключен. Звук этого таймера включён'
      : 'Общий звук выключен. Звук этого таймера выключен'
  }

  return soundEnabled.value ? 'Выключить звук' : 'Включить звук'
})

function stopAudio() {
  audio.pause()
  audio.currentTime = 0
}

function playSignalSound() {
  if (viewStatus.value !== 'signal') return
  if (!effectiveSoundEnabled.value) return
  if (hasPlayedSound.value) return

  audio.currentTime = 0

  audio.play().catch(() => {
    // Браузер может заблокировать звук, если пользователь ещё не кликал по странице
  })

  hasPlayedSound.value = true
}

watch(viewStatus, () => {
  playSignalSound()
})

watch(effectiveSoundEnabled, (enabled) => {
  if (!enabled) {
    stopAudio()
    return
  }

  playSignalSound()
})

const canStop = computed(() => viewStatus.value === 'active')

const durationMinutes = computed(() => {
  return Math.round(props.timer.durationSeconds / 60)
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
  if (props.isReorderMode) return 'Сначала сохраните порядок'
  if (!canStop.value) return 'Остановить можно только активный таймер'

  return 'Остановить'
})

const editButtonTitle = computed(() => {
  if (props.isReorderMode) return 'Сначала сохраните порядок'
  if (!canEditTimer.value) return 'Недостаточно прав'

  return 'Редактировать'
})

const deleteButtonTitle = computed(() => {
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
  if (props.isReorderMode) return

  stopAudio()

  addCompletedTimer(props.timer.id)
}

function toggleSound() {
  if (props.isReorderMode) return

  soundEnabled.value = toggleTimerSound(props.timer.id)

  if (!soundEnabled.value) {
    stopAudio()
  }
}

function openRestartModal() {
  if (props.isReorderMode) return

  showRestartModal.value = true
}

function handleRestart(timeShiftSeconds: number) {
  timersStore.restartTimer(props.timer.id, timeShiftSeconds)

  hasPlayedSound.value = false
  stopAudio()

  showRestartModal.value = false
}

function stopTimer() {
  if (props.isReorderMode) return

  timersStore.stopTimer(props.timer.id)

  stopAudio()
}

function openEditModal() {
  if (props.isReorderMode) return
  if (!canEditTimer.value) return

  showEditModal.value = true
}

function handleUpdateTimer(payload: TimerFormPayload) {
  timersStore.updateTimer(props.timer.id, payload)

  showEditModal.value = false
}

function openDeleteModal() {
  if (props.isReorderMode) return
  if (!canDeleteTimer.value) return

  showDeleteModal.value = true
}

function handleDeleteTimer() {
  stopAudio()

  timersStore.deleteTimer(props.timer.id)

  showDeleteModal.value = false
}
</script>

<template>
  <div :class="['row', { highlighted: viewStatus === 'signal' }]">
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

    <div>
      {{ durationMinutes }} мин
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
      <div class="user">{{ timer.lastRunBy }}</div>
    </div>

    <div class="actions">
      <button
        v-if="viewStatus === 'signal'"
        class="complete-btn"
        :disabled="isReorderMode"
        :title="isReorderMode ? 'Сначала сохраните порядок' : 'Завершить'"
        @click="completeTimer"
      >
        Завершить
      </button>

      <template v-else>
        <IconButton
          title="Перезапустить"
          :disabled="isReorderMode"
          @click="openRestartModal"
        >
          <img :src="restartIcon" alt="restart" />
        </IconButton>

        <IconButton
          class="action-button"
          :disabled="isReorderMode || !canStop"
          :title="stopButtonTitle"
          @click="stopTimer"
        >
          <img :src="stopIcon" alt="stop" />
        </IconButton>

        <IconButton
          :disabled="isReorderMode"
          :title="soundButtonTitle"
          @click="toggleSound"
        >
          <img
            :src="soundEnabled ? volumeOnIcon : volumeOffIcon"
            alt="sound"
          />
        </IconButton>

        <IconButton
          :disabled="isReorderMode || !canEditTimer"
          :title="editButtonTitle"
          @click="openEditModal"
        >
          <img :src="editIcon" alt="edit" />
        </IconButton>

        <IconButton
          :disabled="isReorderMode || !canDeleteTimer"
          :title="deleteButtonTitle"
          @click="openDeleteModal"
        >
          <img :src="deleteIcon" alt="delete" />
        </IconButton>
      </template>
    </div>
  </div>

  <RestartTimerModal
    v-if="showRestartModal"
    :duration-seconds="timer.durationSeconds"
    @close="showRestartModal = false"
    @submit="handleRestart"
  />

  <AddTimerModal
    v-if="showEditModal"
    mode="edit"
    :timer="timer"
    @close="showEditModal = false"
    @submit="handleUpdateTimer"
  />

  <ConfirmDeleteModal
    v-if="showDeleteModal"
    :timer-title="timer.title"
    @close="showDeleteModal = false"
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
  box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
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
</style>