<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Timer } from '../../types/timer'
import { addCompletedTimer } from '../../utils/completedTimers'
import { isSoundEnabled, toggleTimerSound } from '../../utils/soundSettings'
import { useTimerView } from '../../composables/useTimerView'
import beepSound from '../../assets/sounds/beep.mp3'
import { useTimersStore } from '../../stores/timers'
import RestartTimerModal from './RestartTimerModal.vue'
import IconButton from '../ui/IconButton.vue'

const props = defineProps<{
  timer: Timer
}>()

const timersStore = useTimersStore()
const showRestartModal = ref(false)

const {
  remaining,
  viewStatus,
  statusLabel,
} = useTimerView(props.timer)

const audio = new Audio(beepSound)
const hasPlayedSound = ref(false)
const soundEnabled = ref(isSoundEnabled(props.timer.id))

watch(viewStatus, (newStatus) => {
  if (newStatus === 'signal' && soundEnabled.value && !hasPlayedSound.value) {
    audio.currentTime = 0

    audio.play().catch(() => {
      // Браузер может заблокировать звук, если пользователь ещё не кликал по странице
    })

    hasPlayedSound.value = true
  }
})

const canStop = computed(() => viewStatus.value === 'active')
const canComplete = computed(() => viewStatus.value === 'signal')

const durationMinutes = computed(() => {
  return Math.round(props.timer.durationSeconds / 60)
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
  audio.pause()
  audio.currentTime = 0

  addCompletedTimer(props.timer.id)
}

function toggleSound() {
  soundEnabled.value = toggleTimerSound(props.timer.id)

  if (!soundEnabled.value) {
    audio.pause()
    audio.currentTime = 0
  }
}

function openRestartModal() {
  showRestartModal.value = true
}

function handleRestart(timeShiftSeconds: number) {
  timersStore.restartTimer(props.timer.id, timeShiftSeconds)

  hasPlayedSound.value = false
  audio.pause()
  audio.currentTime = 0

  showRestartModal.value = false
}

function stopTimer() {
  timersStore.stopTimer(props.timer.id)

  audio.pause()
  audio.currentTime = 0
}

</script>

<template>
  <div :class="['row', { highlighted: viewStatus === 'signal' }]">
    <div class="name">
      <div class="img"></div>
      <span>{{ timer.title }}</span>
    </div>

    <div>
      <span :class="['status', viewStatus]">
        {{ statusLabel }}
      </span>
    </div>

    <div class="desc">
      {{ timer.description }}
    </div>

    <div>
      {{ durationMinutes }} мин
    </div>

    <div class="time">
      {{ viewStatus === 'stopped' ? '00:00:00' : formatTime(remaining) }}
    </div>

    <div class="last-run">
      <div>2026-04-25&nbsp;&nbsp;&nbsp;14:30</div>
      <div class="user">Pupok Pupochkov</div>
    </div>

    <div class="actions">
      <button
        v-if="canComplete"
        class="complete-btn"
        @click="completeTimer"
      >
        Завершить
      </button>

      <IconButton title="Перезапустить" @click="openRestartModal">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 4v6h6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M20 11a8 8 0 1 0-2.3 5.7" stroke-width="2" stroke-linecap="round" />
        </svg>
      </IconButton>

      <IconButton v-if="canStop" title="Остановить" @click="stopTimer">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="7" y="7" width="10" height="10" rx="1" stroke-width="2" />
        </svg>
      </IconButton>

      <IconButton
        :title="soundEnabled ? 'Выключить звук' : 'Включить звук'"
        @click="toggleSound"
      >
        <svg v-if="soundEnabled" viewBox="0 0 24 24" fill="none">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" stroke-width="2" stroke-linejoin="round" />
          <path d="M16 8a5 5 0 0 1 0 8" stroke-width="2" stroke-linecap="round" />
        </svg>

        <svg v-else viewBox="0 0 24 24" fill="none">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" stroke-width="2" stroke-linejoin="round" />
          <path d="M18 9l-4 4m0-4 4 4" stroke-width="2" stroke-linecap="round" />
        </svg>
      </IconButton>

      <IconButton title="Редактировать">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 20h4l10-10-4-4L4 16v4Z" stroke-width="2" stroke-linejoin="round" />
          <path d="M13 7l4 4" stroke-width="2" stroke-linecap="round" />
        </svg>
      </IconButton>

      <IconButton title="Удалить">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M5 7h14" stroke-width="2" stroke-linecap="round" />
          <path d="M9 7V5h6v2" stroke-width="2" stroke-linejoin="round" />
          <path d="M8 10v9h8v-9" stroke-width="2" stroke-linejoin="round" />
        </svg>
      </IconButton>


    </div>
  </div>

  <RestartTimerModal
    v-if="showRestartModal"
    @close="showRestartModal = false"
    @submit="handleRestart"
  />
</template>


<style scoped>
.row {
  display: grid;
  grid-template-columns: 220px 120px 1fr 120px 120px 200px 180px;
  align-items: center;
  gap: 12px;
  background: white;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 12px;
  min-height: 76px;
}

.row.highlighted {
  border: 2px solid #6f89ad;
}

.name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.img {
  width: 36px;
  height: 36px;
  background: #edf1f5;
  border-radius: 6px;
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
  line-height: 1.2;
  min-width: 0;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;

  overflow: hidden;
}

.time {
  font-weight: 700;
  font-size: 16px;
  text-align: center;
}

.last-run {
  font-size: 13px;
  line-height: 1.2;
}

.user {
  margin-top: 4px;
  color: #a0a7b4;
  font-size: 13px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-start;
  flex-wrap: nowrap;
}

/* button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
} */

.complete-btn {
  min-width: 150px;
  padding: 10px 16px;
  border-radius: 999px;
  background: #6f89ad;
  color: white;
  font-size: 14px;
  font-weight: 600;
}
</style>
