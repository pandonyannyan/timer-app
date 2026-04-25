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
</style>
