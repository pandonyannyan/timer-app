<template>
  <div class="table">
    <div class="header">
      <button class="header-button" type="button" @click="$emit('changeSort', 'title')">
        Название {{ sortBy === 'title' ? sortIcon : '' }}
      </button>

      <div>Статус</div>
      <div>Описание</div>
      <div>Длительность</div>

      <button class="header-button" type="button" @click="$emit('changeSort', 'remaining')">
        Осталось {{ sortBy === 'remaining' ? sortIcon : '' }}
      </button>

      <div>Последний запуск</div>
      <div>Действия</div>
    </div>

    <TimerRow
      v-for="timer in timers"
      :key="timer.id"
      :timer="timer"
    />

    <div v-if="timers.length === 0" class="empty">
      Таймеры не найдены
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TimerRow from './TimerRow.vue'
import type { Timer } from '../../types/timer'

const props = defineProps<{
  timers: Timer[]
  sortBy: 'title' | 'remaining'
  sortDirection: 'asc' | 'desc'
}>()

defineEmits<{
  (e: 'changeSort', value: 'title' | 'remaining'): void
}>()

const sortIcon = computed(() => {
  return props.sortDirection === 'asc' ? '↑' : '↓'
})
</script>

<style scoped>
.table {
  background: #eef3f7;
  border-radius: 20px;
  padding: 18px 12px 10px;
}

.header {
  display: grid;
  grid-template-columns: 200px 115px minmax(260px, 1fr) 105px 110px 230px 140px;
  gap: 18px;

  padding: 14px 16px 18px;

  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.header-button {
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;
  color: #4b5563;
  font: inherit;
  cursor: pointer;
}

.header-button:hover {
  color: #111827;
}

.empty {
  padding: 32px;
  text-align: center;
  color: #6b7280;
  background: white;
  border-radius: 16px;
}
</style>
