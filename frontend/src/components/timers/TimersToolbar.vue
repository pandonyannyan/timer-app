<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="tabs">
        <button
          :class="['tab', { active: statusFilter === 'all' }]"
          type="button"
          :disabled="isReorderMode"
          @click="$emit('update:statusFilter', 'all')"
        >
          Все
        </button>

        <button
          :class="['tab', { active: statusFilter === 'active' }]"
          type="button"
          :disabled="isReorderMode"
          @click="$emit('update:statusFilter', 'active')"
        >
          Активные
        </button>
      </div>

      <div :class="['search', { disabled: isReorderMode }]">
        <img class="search-icon" :src="searchIcon" alt="search">

        <input
          :value="searchQuery"
          type="text"
          placeholder="Поиск"
          :disabled="isReorderMode"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        >
      </div>
    </div>

    <div class="toolbar-right">
      <div class="global-sound" :title="globalSoundButtonTitle">
        <img
          class="global-sound-icon"
          :src="volumeOffIcon"
          alt="sound off"
        >

        <button
          :class="['sound-toggle', { active: globalSoundEnabled }]"
          type="button"
          :aria-pressed="globalSoundEnabled"
          :title="globalSoundButtonTitle"
          @click="toggleGlobalSound"
        >
          <span class="sound-toggle-track">
            <span class="sound-toggle-thumb" />
          </span>
        </button>

        <img
          class="global-sound-icon"
          :src="volumeOnIcon"
          alt="sound on"
        >
      </div>

      <button
        class="secondary-btn with-icon"
        type="button"
        :disabled="actionsDisabled || !canReorderPinnedTimers"
        :title="reorderButtonTitle"
        @click="$emit('toggleReorder')"
      >
        <img :src="swapIcon" alt="swap">
        <span>{{ isReorderMode ? 'Сохранить порядок' : 'Изменить порядок' }}</span>
      </button>

      <button
        class="secondary-btn with-icon"
        type="button"
        :disabled="actionsDisabled || !canCreateTimer || isReorderMode"
        :title="addButtonTitle"
        @click="openAddTimerModal"
      >
        <img :src="addIcon" alt="add">
        <span>Добавить таймер</span>
      </button>
    </div>
  </div>

  <AddTimerModal
    v-if="showAddTimerModal"
    @close="closeAddTimerModal"
    @submit="handleCreateTimer"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import searchIcon from '../../assets/icons/search.svg'
import swapIcon from '../../assets/icons/swap.svg'
import addIcon from '../../assets/icons/add.svg'
import volumeOnIcon from '../../assets/icons/volume-on.svg'
import volumeOffIcon from '../../assets/icons/volume-off.svg'
import AddTimerModal from './AddTimerModal.vue'
import { useTimersStore } from '../../stores/timers'
import { usePermissions } from '../../composables/usePermissions'
import type { TimerFormPayload } from '../../types/timer'
import {
  globalSoundEnabled,
  toggleGlobalSound,
} from '../../utils/soundSettings'

const props = defineProps<{
  searchQuery: string
  statusFilter: 'all' | 'active'
  isReorderMode: boolean
  canReorderPinnedTimers: boolean
  actionsDisabled: boolean
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:statusFilter', value: 'all' | 'active'): void
  (e: 'toggleReorder'): void
}>()

const timersStore = useTimersStore()
const showAddTimerModal = ref(false)

const {
  canCreateTimer,
} = usePermissions()

const reorderButtonTitle = computed(() => {
  if (props.actionsDisabled) {
    return 'Действия временно недоступны'
  }

  if (props.isReorderMode) {
    return 'Сохранить порядок закреплённых таймеров'
  }

  if (!props.canReorderPinnedTimers) {
    return 'Закрепите минимум два таймера, чтобы изменить их порядок'
  }

  return 'Изменить порядок закреплённых таймеров'
})

const addButtonTitle = computed(() => {
  if (props.actionsDisabled) return 'Действия временно недоступны'
  if (!canCreateTimer.value) return 'Недостаточно прав'
  if (props.isReorderMode) return 'Сначала сохраните порядок'

  return 'Добавить таймер'
})

const globalSoundButtonTitle = computed(() => {
  return globalSoundEnabled.value
    ? 'Выключить звук для всех таймеров'
    : 'Включить звук для всех таймеров'
})

function blurActiveElement() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function openAddTimerModal() {
  if (props.actionsDisabled || !canCreateTimer.value || props.isReorderMode) return

  showAddTimerModal.value = true
  blurActiveElement()
}

function closeAddTimerModal() {
  showAddTimerModal.value = false
  blurActiveElement()
}

async function handleCreateTimer(payload: TimerFormPayload) {
  try {
    await timersStore.createTimer(payload)
    closeAddTimerModal()
  } catch (error) {
    console.error('Failed to create timer', error)
  }
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

.search.disabled {
  opacity: 0.55;
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

.tab:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.search input:disabled {
  cursor: not-allowed;
}

.global-sound {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  height: 42px;
  color: #6f89ad;
}

.global-sound-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.sound-toggle {
  display: inline-flex;
  align-items: center;

  padding: 0;
  border: none;
  background: transparent;

  cursor: pointer;
}

.sound-toggle-track {
  position: relative;

  width: 42px;
  height: 24px;

  border-radius: 999px;
  background: #d8e1ec;

  transition: background 0.15s ease;
}

.sound-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;

  width: 18px;
  height: 18px;

  border-radius: 50%;
  background: #ffffff;

  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);

  transition: transform 0.15s ease;
}

.sound-toggle.active .sound-toggle-track {
  background: #6f89ad;
}

.sound-toggle.active .sound-toggle-thumb {
  transform: translateX(18px);
}

.sound-toggle:hover .sound-toggle-track {
  background: #c8d4e0;
}

.sound-toggle.active:hover .sound-toggle-track {
  background: #5f7a9f;
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