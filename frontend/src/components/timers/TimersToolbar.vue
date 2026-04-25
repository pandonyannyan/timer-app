<template>
  <div class="toolbar">
    <div class="left">
      <button class="tab active">Все</button>
      <button class="tab">Активные</button>

      <input class="search" placeholder="Поиск" />
    </div>

    <div class="right">
      <button class="btn">Поменять местами</button>
      <button class="btn primary">+ Добавить таймер</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tab {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #ccc;
  background: white;
}

.tab.active {
  background: #e6f0ff;
}

.search {
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #ccc;
  width: 300px;
}

.right {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #ccc;
  background: white;
}

.btn.primary {
  background: #5b7cff;
  color: white;
}
</style>
