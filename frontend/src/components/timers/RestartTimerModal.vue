<template>
  <div class="overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2>Повторный запуск</h2>
        <button class="close-btn" type="button" @click="close">×</button>
      </div>
      
      <form class="restart-form">
        <div class="options">
          <label :class="['option', { active: mode === 'now' }]">
            <input type="radio" value="now" v-model="mode" />
            <span>Запустить от текущего времени</span>
          </label>

          <label :class="['option', { active: mode === 'shift' }]">
            <input type="radio" value="shift" v-model="mode" />
            <span>Запустить со сдвигом</span>
          </label>
        </div>

        <div v-if="mode === 'shift'" class="shift-block">
          <label class="field-label" for="shift-minutes">
            Смещение (минут)
          </label>

          <input
            id="shift-minutes"
            class="shift-input"
            type="text"
            inputmode="numeric"
            v-model="minutesInput"
            :class="{ invalid: isShiftInvalid }"
          />

          <p class="error error-slot">
            {{ shiftErrorMessage || '\u00A0' }}
          </p>

          <p class="hint">
            Базовая длительность таймера будет уменьшена на указанное значение
          </p>
        </div>

        <div class="actions">
          <button class="secondary-btn" type="button" @click="close">
            Отмена
          </button>

          <button
            class="primary-btn"
            type="button"
            :disabled="isSubmitDisabled"
            :title="isSubmitDisabled ? 'Введите корректное смещение' : 'Запустить таймер'"
            @click="submit"
          >
            Запустить
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  durationSeconds: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', timeShiftSeconds: number): void
}>()

const mode = ref<'now' | 'shift'>('now')
const minutesInput = ref('1')

const maxShiftMinutes = computed(() => {
  return Math.floor(props.durationSeconds / 60)
})

const isValidMinutesFormat = computed(() => {
  return /^\d+$/.test(minutesInput.value)
})

const shiftMinutes = computed(() => {
  if (!isValidMinutesFormat.value) return 0

  return Number(minutesInput.value)
})

const isShiftTooSmall = computed(() => {
  return isValidMinutesFormat.value && shiftMinutes.value < 1
})

const isShiftTooLarge = computed(() => {
  return isValidMinutesFormat.value && shiftMinutes.value > maxShiftMinutes.value
})

const isShiftInvalid = computed(() => {
  return mode.value === 'shift' && (
    !isValidMinutesFormat.value ||
    isShiftTooSmall.value ||
    isShiftTooLarge.value
  )
})

const shiftErrorMessage = computed(() => {
  if (!isValidMinutesFormat.value) {
    return 'Введите целое количество минут: 1, 5, 10, 60...'
  }

  if (isShiftTooSmall.value) {
    return 'Смещение должно быть не меньше 1 минуты'
  }

  if (isShiftTooLarge.value) {
    return `Смещение не может быть больше длительности таймера (${maxShiftMinutes.value} мин)`
  }

  return ''
})

const isSubmitDisabled = computed(() => {
  return isShiftInvalid.value
})

function submit() {
  if (isSubmitDisabled.value) return

  const shift =
    mode.value === 'shift'
      ? shiftMinutes.value * 60
      : 0

  emit('submit', shift)
}

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
    submit()
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
  margin-bottom: 20px;
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

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 48px;
  padding: 12px 14px;

  border: 1px solid #d8e1ec;
  border-radius: 16px;
  background: #ffffff;

  cursor: pointer;
  color: #374151;
}

.option.active {
  border-color: #6f89ad;
  background: #f4f8fd;
}

.option input {
  accent-color: #6f89ad;
}

.shift-block {
  margin-top: 16px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.shift-input {
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    outline-color 0.15s ease;

  width: 100%;
  height: 44px;

  border: 1px solid #d8e1ec;
  border-radius: 14px;
  padding: 0 14px;

  font-size: 16px;
  line-height: 44px;

  box-sizing: border-box;

  /* убираем стрелки Firefox */
  appearance: textfield;
  -moz-appearance: textfield;
}

/* убираем стрелки Chrome / Edge */
.shift-input::-webkit-outer-spin-button,
.shift-input::-webkit-inner-spin-button {
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
}

.shift-input:focus {
  outline: none;
  border-color: #6f89ad;
  background: #f9fbff;
}

.shift-input.invalid {
  border-color: #d8a5a5;
  background: #fffafa;
}

.shift-input.invalid:focus {
  outline: none;
  border-color: #c98b8b;
  background: #fffafa;
}

.error {
  margin: 6px 0 0;

  color: #b15b5b;
  font-size: 13px;
  line-height: 1.35;
}

.error-slot {
  min-height: 20px;
}

.hint {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.35;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.secondary-btn,
.primary-btn {
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

.primary-btn {
  background: #6f89ad;
  color: #ffffff;
}

.primary-btn:hover {
  background: #5f7a9f;
}

.primary-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.primary-btn:disabled {
  background: #6f89ad;
  color: #ffffff;
  opacity: 0.45;
  cursor: not-allowed;
}

.primary-btn:disabled:hover {
  background: #6f89ad;
}

.restart-form {
  margin: 0;
}
</style>