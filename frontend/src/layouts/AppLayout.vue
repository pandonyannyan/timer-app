<template>
  <main class="app-layout">
    <div class="page">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #f5f7fb;
}

/* Центрирование контента */
.page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}
</style>
