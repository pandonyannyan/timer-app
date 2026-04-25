<template>
  <button class="icon-button" :title="title" type="button">
    <span class="icon">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<style scoped>
.icon-button {
  width: 32px;
  height: 32px;
  color: #4b5563;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #4b5563;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-button:hover {
  background: #eef3f7;
}

.icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
}

.icon :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
}

.icon img {
  width: 18px;
  height: 18px;
}
</style>
