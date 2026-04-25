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
import restartIcon from '../../assets/icons/restart.svg'
import stopIcon from '../../assets/icons/stop.svg'
import volumeOnIcon from '../../assets/icons/volume-on.svg'
import volumeOffIcon from '../../assets/icons/volume-off.svg'
import editIcon from '../../assets/icons/edit.svg'
import deleteIcon from '../../assets/icons/delete.svg'

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
    <!-- Только для signal -->
    <button
      v-if="viewStatus === 'signal'"
      class="complete-btn"
      @click="completeTimer"
    >
      Завершить
    </button>

    <!-- Все остальные состояния -->
    <template v-else>
      <IconButton title="Перезапустить" @click="openRestartModal">
        <img :src="restartIcon" alt="restart" />
      </IconButton>

      <IconButton v-if="canStop" title="Остановить" @click="stopTimer">
        <img :src="stopIcon" alt="stop" />
      </IconButton>

      <IconButton
        :title="soundEnabled ? 'Выключить звук' : 'Включить звук'"
        @click="toggleSound"
      >
        <img
          :src="soundEnabled ? volumeOnIcon : volumeOffIcon"
          alt="sound"
        />
      </IconButton>

      <IconButton title="Редактировать">
        <img :src="editIcon" alt="edit" />
      </IconButton>

      <IconButton title="Удалить">
        <img :src="deleteIcon" alt="delete" />
      </IconButton>
    </template>
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
  gap: 6px;
  justify-content: flex-start;
  flex-wrap: nowrap;
}

.complete-btn {
  min-width: 132px;
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

.complete-btn:active {
  transform: scale(0.98);
}
</style>
