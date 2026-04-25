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

    <TimerRow view-status="signal" />
    <TimerRow view-status="active" />
    <TimerRow view-status="active" />
    <TimerRow view-status="stopped" />
    <TimerRow view-status="completed" />
  </div>
</template>

<script setup lang="ts">
import TimerRow from './TimerRow.vue'
</script>

<style scoped>
.table {
  background: #eef3f7;
  border-radius: 20px;
  padding: 16px;
}

.header {
  display: grid;
  grid-template-columns: 200px 120px 1fr 120px 120px 220px 240px;
  padding: 16px 12px;
  font-size: 14px;
  color: #4b5563;
}
</style>
