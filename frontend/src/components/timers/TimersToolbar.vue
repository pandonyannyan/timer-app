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
      <button class="secondary-btn with-icon" type="button">
        <img :src="swapIcon" alt="swap" />
        <span>Поменять местами</span>
      </button>

      <button class="primary-btn" type="button">
        + Добавить таймер
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import searchIcon from '../../assets/icons/search.svg'
import swapIcon from '../../assets/icons/swap.svg'

defineProps<{
  searchQuery: string
  statusFilter: 'all' | 'active'
}>()

defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:statusFilter', value: 'all' | 'active'): void
}>()
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
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

.search {
  width: 420px;
  height: 42px;
  display: flex;
  align-items: center;
  gap: 8px;

  border: 1px solid #6f89ad;
  border-radius: 999px;
  background: white;
  padding: 0 16px;
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
</style>
