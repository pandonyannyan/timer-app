<template>
  <div :class="['table', { 'table--reorder': isReorderMode }]">
    <div class="header">
      <div class="header-cell header-cell--pin">
        <span v-if="isReorderMode">Порядок</span>
      </div>

      <div class="header-cell">Название</div>
      <div class="header-cell">Статус</div>
      <div class="header-cell">Описание</div>
      <div class="header-cell">Длительность</div>
      <div class="header-cell">Осталось</div>
      <div class="header-cell">Последний запуск</div>
      <div class="header-cell header-cell--actions">Действия</div>
    </div>

    <div
      v-for="(timer, index) in timers"
      :key="timer.id"
      :class="[
        'row-wrapper',
        {
          'row-wrapper--reorder': isReorderMode,
          'row-wrapper--dragging': draggedIndex === index,
        },
      ]"
      :draggable="isReorderMode"
      @dragstart="handleDragStart(index)"
      @dragover.prevent
      @dragenter.prevent
      @drop="handleDrop(index)"
      @dragend="handleDragEnd"
    >
      <TimerRow
        :timer="timer"
        :is-reorder-mode="isReorderMode"
        :is-pinned="pinnedTimerIds.includes(timer.id)"
        @toggle-pin="$emit('togglePin', timer.id)"
      />
    </div>

    <div v-if="timers.length === 0" class="empty">
      {{ isReorderMode ? 'Закреплённые таймеры не найдены' : 'Таймеры не найдены' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TimerRow from './TimerRow.vue'
import type { Timer } from '../../types/timer'

const props = defineProps<{
  timers: Timer[]
  isReorderMode: boolean
  pinnedTimerIds: string[]
}>()

const emit = defineEmits<{
  (e: 'reorder', value: Timer[]): void
  (e: 'togglePin', timerId: string): void
}>()

const draggedIndex = ref<number | null>(null)

function handleDragStart(index: number) {
  if (!props.isReorderMode) return

  draggedIndex.value = index
}

function handleDrop(targetIndex: number) {
  if (!props.isReorderMode) return
  if (draggedIndex.value === null) return
  if (draggedIndex.value === targetIndex) return

  const nextTimers = [...props.timers]
  const [movedTimer] = nextTimers.splice(draggedIndex.value, 1)

  nextTimers.splice(targetIndex, 0, movedTimer)

  emit('reorder', nextTimers)

  draggedIndex.value = null
}

function handleDragEnd() {
  draggedIndex.value = null
}
</script>

<style scoped>
.table {
  --timers-grid-columns: 44px 200px 115px minmax(260px, 1fr) 105px 110px 230px 190px;
  --timers-grid-gap: 18px;

  container-type: inline-size;

  background: #eef3f7;
  border-radius: 20px;
  padding: 18px 12px 10px;
}

.table--reorder {
  box-shadow: 0 0 0 2px rgba(111, 137, 173, 0.25);
}

.header {
  display: grid;
  grid-template-columns: var(--timers-grid-columns);
  gap: var(--timers-grid-gap);

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

.header-cell--pin {
  justify-content: center;
  font-size: 12px;
}

.header-cell--actions {
  justify-content: flex-start;
}

.row-wrapper {
  border-radius: 16px;
}

.row-wrapper--reorder {
  cursor: grab;
}

.row-wrapper--reorder:active {
  cursor: grabbing;
}

.row-wrapper--reorder :deep(.row) {
  cursor: grab;
}

.row-wrapper--dragging {
  opacity: 0.45;
}

.empty {
  padding: 32px;
  text-align: center;
  color: #6b7280;
  background: white;
  border-radius: 16px;
}

@container (max-width: 1400px) {
  .header {
    display: none;
  }
}
</style>