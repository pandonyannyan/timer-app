<template>
  <div class="overlay">
    <div class="modal">
      <h2>Повторный запуск</h2>

      <label>
        <input type="radio" value="now" v-model="mode" />
        Запустить от текущего времени
      </label>

      <label>
        <input type="radio" value="shift" v-model="mode" />
        Запустить со сдвигом
      </label>

      <div v-if="mode === 'shift'" class="shift-block">
        <p>Время уменьшится на указанное количество минут:</p>

        <input
          type="number"
          v-model.number="minutes"
          min="0"
        />
      </div>

      <div class="actions">
        <button @click="$emit('close')">Отмена</button>
        <button class="primary" @click="submit">Запустить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', timeShiftSeconds: number): void
}>()

const mode = ref<'now' | 'shift'>('now')
const minutes = ref(5)

function submit() {
  const shift = mode.value === 'shift' ? minutes.value * 60 : 0
  emit('submit', shift)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 16px;
  width: 400px;
}

.shift-block {
  margin-top: 12px;
}

.actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary {
  background: #6f89ad;
  color: white;
  padding: 8px 16px;
  border-radius: 12px;
}
</style>
