<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Удалить таймер?</h2>

        <button class="close-btn" type="button" @click="close">
          ×
        </button>
      </div>

      <p class="message">
        Таймер <span class="timer-title">«{{ timerTitle }}»</span> будет удалён из списка.
        Это действие нельзя отменить.
      </p>

      <div class="actions">
        <button class="secondary-btn" type="button" @click="close">
          Отмена
        </button>

        <button class="danger-btn" type="button" @click="$emit('confirm')">
          Удалить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

defineProps<{
  timerTitle: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm'): void
}>()

function close() {
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;

  background: rgba(17, 24, 39, 0.35);
  backdrop-filter: blur(2px);

  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal {
  width: 100%;
  max-width: 460px;

  background: #ffffff;
  border-radius: 24px;
  padding: 24px;

  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.modal-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #f3f6fa;
  color: #6b7280;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.close-btn:hover {
  background: #e8eef5;
}

.message {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.45;
}

.timer-title {
  color: #111827;
  font-weight: 700;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.secondary-btn,
.danger-btn {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.secondary-btn {
  background: #f3f6fa;
  color: #374151;
}

.secondary-btn:hover {
  background: #e8eef5;
}

.danger-btn {
  background: #b16969;
  color: #ffffff;
}

.danger-btn:hover {
  background: #9f5a5a;
}

.danger-btn:active,
.secondary-btn:active {
  transform: scale(0.98);
}
</style>