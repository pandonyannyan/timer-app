<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="tabs">
        <button
          :class="['tab', { active: statusFilter === 'all' }]"
          type="button"
          @click="$emit('update:statusFilter', 'all')"
        >
          Все
        </button>

        <button
          :class="['tab', { active: statusFilter === 'active' }]"
          type="button"
          @click="$emit('update:statusFilter', 'active')"
        >
          Активные
        </button>
      </div>

      <div class="search">
        <img class="search-icon" :src="searchIcon" alt="search" />

        <input
          :value="searchQuery"
          type="text"
          placeholder="Поиск"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <div class="toolbar-right">
      <button
        class="secondary-btn with-icon"
        type="button"
        :disabled="!canReorderTimers"
        :title="canReorderTimers ? 'Поменять местами' : 'Недостаточно прав'"
      >
        <img :src="swapIcon" alt="swap" />
        <span>Поменять местами</span>
      </button>

      <button
        class="secondary-btn with-icon"
        type="button"
        :disabled="!canCreateTimer"
        :title="canCreateTimer ? 'Добавить таймер' : 'Недостаточно прав'"
        @click="openAddTimerModal"
      >
        <img :src="addIcon" alt="add" />
        <span>Добавить таймер</span>
      </button>
    </div>
  </div>

  <AddTimerModal
    v-if="showAddTimerModal"
    @close="showAddTimerModal = false"
    @submit="handleCreateTimer"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import searchIcon from '../../assets/icons/search.svg'
import swapIcon from '../../assets/icons/swap.svg'
import addIcon from '../../assets/icons/add.svg'
import AddTimerModal from './AddTimerModal.vue'
import { useTimersStore } from '../../stores/timers'
import { usePermissions } from '../../composables/usePermissions'
import type { TimerFormPayload } from '../../types/timer'

defineProps<{
  searchQuery: string
  statusFilter: 'all' | 'active'
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:statusFilter', value: 'all' | 'active'): void
}>()

const timersStore = useTimersStore()
const showAddTimerModal = ref(false)

const {
  canCreateTimer,
  canReorderTimers,
} = usePermissions()

function openAddTimerModal() {
  if (!canCreateTimer.value) return

  showAddTimerModal.value = true
}

function handleCreateTimer(payload: TimerFormPayload) {
  timersStore.createTimer(payload)
  showAddTimerModal.value = false
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  min-width: 0;
  flex: 1 1 auto;
}

.toolbar-right {
  flex: 0 0 auto;
}

.search {
  width: min(420px, 100%);
  min-width: 220px;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;

  border: 1px solid #6f89ad;
  border-radius: 999px;
  background: white;
  padding: 0 16px;
}

@media (max-width: 768px) {
  .toolbar {
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .search {
    flex: 1 1 220px;
  }

  .toolbar-right {
    justify-content: flex-start;
  }
}

.tabs {
  display: flex;
  border: 1px solid #6f89ad;
  border-radius: 999px;
  overflow: hidden;
  background: white;
}

.tab {
  height: 40px;
  padding: 0 18px;
  border: none;
  background: white;
  color: #6f89ad;
  font-weight: 600;
  cursor: pointer;
}

.tab.active {
  background: #eef3f7;
}

.search-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
}

.secondary-btn,
.primary-btn {
  height: 42px;
  padding: 0 22px;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn {
  border: 1px solid #6f89ad;
  background: white;
  color: #6f89ad;
}

.primary-btn {
  border: none;
  background: #6f89ad;
  color: white;
}

.secondary-btn:hover {
  background: #f4f8fd;
}

.primary-btn:hover {
  background: #5f7a9f;
}

.with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.with-icon img {
  width: 18px;
  height: 18px;
  display: block;
}

.secondary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.secondary-btn:disabled:hover {
  background: white;
}
</style>