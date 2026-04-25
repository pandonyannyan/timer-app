<template>
  <div class="page">
    <h1 class="title">Мои таймеры</h1>

    <TimersToolbar />

    <TimersTable />
  </div>
</template>

<script setup lang="ts">
import TimersToolbar from '../components/timers/TimersToolbar.vue'
import TimersTable from '../components/timers/TimersTable.vue'
</script>

<style scoped>
.page {
  padding: 24px;
}

.title {
  margin-bottom: 16px;
}
</style>
