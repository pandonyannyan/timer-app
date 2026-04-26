<template>
  <div class="table">
    <div class="header">
      <div class="header-cell header-cell--sortable">
        <span>Название</span>

        <button
          class="sort-button"
          :class="{ 'sort-button--active': sortBy === 'title' }"
          type="button"
          title="Сортировать по названию"
          aria-label="Сортировать по названию"
          @click="$emit('changeSort', 'title')"
        >
          <img
            class="sort-icon"
            :class="{ 'sort-icon--desc': sortBy === 'title' && sortDirection === 'desc' }"
            :src="sortIcon"
            alt=""
          >
        </button>
      </div>

      <div class="header-cell">Статус</div>
      <div class="header-cell">Описание</div>
      <div class="header-cell">Длительность</div>

      <div class="header-cell header-cell--sortable">
        <span>Осталось</span>

        <button
          class="sort-button"
          :class="{ 'sort-button--active': sortBy === 'remaining' }"
          type="button"
          title="Сортировать по оставшемуся времени"
          aria-label="Сортировать по оставшемуся времени"
          @click="$emit('changeSort', 'remaining')"
        >
          <img
            class="sort-icon"
            :class="{ 'sort-icon--desc': sortBy === 'remaining' && sortDirection === 'desc' }"
            :src="sortIcon"
            alt=""
          >
        </button>
      </div>

      <div class="header-cell">Последний запуск</div>
      <div class="header-cell header-cell--actions">Действия</div>
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
import TimerRow from './TimerRow.vue'
import sortIcon from '../../assets/icons/sort.svg'
import type { Timer } from '../../types/timer'

defineProps<{
  timers: Timer[]
  sortBy: 'title' | 'remaining' | null
  sortDirection: 'asc' | 'desc'
}>()

defineEmits<{
  (e: 'changeSort', value: 'title' | 'remaining'): void
}>()
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

.header-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 24px;
  line-height: 1;
}

.header-cell--sortable {
  gap: 6px;
}

.header-cell--actions {
  justify-content: flex-start;
}

.sort-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  width: 24px;
  height: 24px;
  padding: 0;

  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: #4b5563;
  cursor: pointer;

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.sort-button:hover {
  background: #eef3f7;
  border-color: #d5dde8;
}

.sort-button:active {
  transform: scale(0.96);
}

.sort-button:focus-visible {
  outline: 2px solid #6f89ad;
  outline-offset: 2px;
}

.sort-button--active {
  background: #eef3f7;
  border-color: #d5dde8;
}

.sort-icon {
  width: 14px;
  height: 14px;
  display: block;
  opacity: 0.65;

  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.sort-button:hover .sort-icon,
.sort-button--active .sort-icon {
  opacity: 1;
}

.sort-icon--desc {
  transform: rotate(180deg);
}

.empty {
  padding: 32px;
  text-align: center;
  color: #6b7280;
  background: white;
  border-radius: 16px;
}
</style>