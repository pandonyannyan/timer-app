<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>Добавить таймер</h2>

        <button class="close-btn" type="button" @click="$emit('close')">
          ×
        </button>
      </div>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label class="field-label" for="timer-title">
            Название
          </label>

          <input
            id="timer-title"
            v-model="title"
            :class="['field-input', { invalid: isTitleInvalid }]"
            type="text"
            placeholder="Например: Новый таймер"
          />

          <p v-if="isTitleInvalid" class="error">
            Введите название таймера
          </p>
        </div>

        <div class="field">
          <label class="field-label" for="timer-description">
            Описание
          </label>

          <textarea
            id="timer-description"
            v-model="description"
            class="field-textarea"
            placeholder="Комментарии и дополнительная информация"
          />
        </div>

        <div class="field">
          <label class="field-label" for="timer-duration">
            Длительность таймера (минут)
          </label>

          <input
            id="timer-duration"
            v-model="durationInput"
            :class="['field-input', { invalid: isDurationInvalid }]"
            type="text"
            inputmode="numeric"
          />

          <p v-if="!isValidDurationFormat" class="error">
            Введите целое количество минут
          </p>

          <p v-else-if="isDurationTooSmall" class="error">
            Длительность должна быть больше 0 минут
          </p>
        </div>

        <div class="field">
          <label class="field-label">
            Добавить изображение
          </label>

          <div class="file-row">
            <label class="file-btn" for="timer-image">
              Выберите файл
            </label>

            <span class="file-name" :title="imageFileName">
              {{ imageFileName }}
            </span>

            <input
              id="timer-image"
              class="file-input"
              type="file"
              accept="image/*"
              @change="handleImageChange"
            />
          </div>
        </div>

        <div class="actions">
          <button class="secondary-btn" type="button" @click="$emit('close')">
            Отмена
          </button>

          <button
            class="primary-btn"
            type="submit"
            :disabled="isSubmitDisabled"
            :title="isSubmitDisabled ? 'Заполните обязательные поля' : 'Сохранить таймер'"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CreateTimerPayload } from '../../types/timer'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: CreateTimerPayload): void
}>()

const title = ref('')
const description = ref('')
const durationInput = ref('5')
const imageFile = ref<File | null>(null)

const trimmedTitle = computed(() => title.value.trim())
const trimmedDescription = computed(() => description.value.trim())

const isTitleInvalid = computed(() => {
  return trimmedTitle.value.length === 0
})

const isValidDurationFormat = computed(() => {
  return /^\d+$/.test(durationInput.value)
})

const durationMinutes = computed(() => {
  if (!isValidDurationFormat.value) return 0

  return Number(durationInput.value)
})

const isDurationTooSmall = computed(() => {
  return isValidDurationFormat.value && durationMinutes.value <= 0
})

const isDurationInvalid = computed(() => {
  return !isValidDurationFormat.value || isDurationTooSmall.value
})

const isSubmitDisabled = computed(() => {
  return isTitleInvalid.value || isDurationInvalid.value
})

const imageFileName = computed(() => {
  return imageFile.value?.name ?? 'Файл не выбран'
})

function handleImageChange(event: Event) {
  const input = event.target as HTMLInputElement

  imageFile.value = input.files?.[0] ?? null
}

function submit() {
  if (isSubmitDisabled.value) return

  emit('submit', {
    title: trimmedTitle.value,
    description: trimmedDescription.value,
    durationMinutes: durationMinutes.value,
    imageFile: imageFile.value,
  })
}
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
  max-width: 520px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;

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

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.field-input,
.field-textarea {
  width: 100%;

  border: 1px solid #d8e1ec;
  border-radius: 14px;
  background: #ffffff;
  color: #374151;

  box-sizing: border-box;

  font: inherit;
  font-size: 16px;

  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.field-input {
  height: 44px;
  padding: 0 14px;
  line-height: 44px;
}

.field-textarea {
  min-height: 96px;
  padding: 12px 14px;
  resize: vertical;
  line-height: 1.35;
}

.field-input::placeholder,
.field-textarea::placeholder {
  color: #9ca3af;
}

.field-input:focus,
.field-textarea:focus {
  outline: none;
  border-color: #6f89ad;
  background: #f9fbff;
}

.field-input.invalid,
.field-textarea.invalid {
  border-color: #d8a5a5;
  background: #fffafa;
}

.field-input.invalid:focus,
.field-textarea.invalid:focus {
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

.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.file-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  height: 40px;
  padding: 0 18px;

  border: 1px solid #6f89ad;
  border-radius: 999px;
  background: #ffffff;

  color: #6f89ad;
  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  box-sizing: border-box;
  white-space: nowrap;
}

.file-btn:hover {
  background: #f4f8fd;
}

.file-name {
  min-width: 0;

  color: #9ca3af;
  font-size: 14px;
  line-height: 1.2;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-input {
  display: none;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
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

.primary-btn:active:not(:disabled),
.secondary-btn:active {
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

@media (max-width: 560px) {
  .modal {
    max-width: 100%;
    padding: 20px;
  }

  .file-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .file-btn {
    width: 100%;
  }

  .actions {
    justify-content: stretch;
  }

  .secondary-btn,
  .primary-btn {
    flex: 1;
  }
}
</style>