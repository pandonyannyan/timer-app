<template>
  <div class="table">
    <div class="header">
      <div>Название</div>
      <div>Статус</div>
      <div>Описание</div>
      <div>Длительность</div>
      <div>Осталось</div>
      <div>Последний запуск</div>
      <div>Действия</div>
    </div>

    <TimerRow
      v-for="timer in timersStore.timers"
      :key="timer.id"
      :timer="timer"
    />
  </div>
</template>

<script setup lang="ts">
import TimerRow from './TimerRow.vue'
import { useTimersStore } from '../../stores/timers'

const timersStore = useTimersStore()
</script>

<style scoped>
.table {
  background: #eef3f7;
  border-radius: 20px;
  padding: 16px;
}

.header {
  display: grid;
  grid-template-columns: 220px 120px 1fr 120px 120px 200px 180px;
  gap: 12px;

  padding: 12px;
  margin-bottom: 8px;

  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

</style>
