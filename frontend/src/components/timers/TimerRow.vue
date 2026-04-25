<script setup lang="ts">
import { computed } from 'vue'
import type { Timer, TimerViewStatus } from '../../types/timer'

const props = defineProps<{
  timer: Timer
}>()

const status = computed<TimerViewStatus>(() => props.timer.status)

const statusLabel = computed(() => {
  const labels: Record<TimerViewStatus, string> = {
    active: 'Активен',
    stopped: 'Остановлен',
    signal: 'Сигнал',
    completed: 'Завершён',
  }

  return labels[status.value]
})

const canStop = computed(() => status.value === 'active')
const canComplete = computed(() => status.value === 'signal')

const durationMinutes = computed(() => {
  return Math.round(props.timer.durationSeconds / 60)
})
</script>


<template>
  <div :class="['row', { highlighted: status === 'signal' }]">
    <div class="name">
      <div class="img"></div>
      <span>{{ timer.title }}</span>
    </div>

    <div>
      <span :class="['status', status]">
        {{ statusLabel }}
      </span>
    </div>

    <div class="desc">
      {{ timer.description }}
    </div>

    <div>{{ durationMinutes }} мин</div>

    <div class="time">
      {{ status === 'signal' || status === 'completed' ? '00:00:00' : '01:35:57' }}
    </div>

    <div class="last-run">
      <div>2026-04-25&nbsp;&nbsp;&nbsp;14:30</div>
      <div class="user">Pupok Pupochkov</div>
    </div>

    <div class="actions">
      <button v-if="canComplete" class="complete-btn">
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
