<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Timer } from '../../types/timer'
import { addCompletedTimer } from '../../utils/completedTimers'
import { useTimerView } from '../../composables/useTimerView'
import beepSound from '../../assets/sounds/beep.mp3'

const props = defineProps<{
  timer: Timer
}>()

const {
  remaining,
  viewStatus,
  statusLabel,
} = useTimerView(props.timer)

const audio = new Audio(beepSound)
const hasPlayedSound = ref(false)

watch(viewStatus, (newStatus) => {
  if (newStatus === 'signal' && props.timer.soundEnabled && !hasPlayedSound.value) {
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

    <div>{{ durationMinutes }} мин</div>

    <div class="time">
       {{ formatTime(remaining) }}
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

      <button title="Перезапустить">↻</button>
      <button v-if="canStop" title="Остановить">□</button>
      <button title="Выключить звук">🔇</button>
      <button title="Редактировать">✎</button>
      <button title="Удалить">🗑</button>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 200px 120px 1fr 120px 120px 220px 240px;
  align-items: center;
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
  gap: 8px;
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
}

.time {
  font-weight: 700;
  font-size: 16px;
}

.last-run {
  font-size: 14px;
}

.user {
  margin-top: 4px;
  color: #a0a7b4;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
}

button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
}

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
