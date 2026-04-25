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
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: #4b5563;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    transform 0.1s ease;
}

.icon-button:hover {
  background: #eef3f7;
  border-color: #d5dde8;
}

.icon-button:active {
  transform: scale(0.96);
}

.icon-button:focus-visible {
  outline: 2px solid #6f89ad;
  outline-offset: 2px;
}

.icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
}

.icon img {
  width: 18px;
  height: 18px;
  display: block;
}

.icon :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
}
</style>
