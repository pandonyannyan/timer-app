import { ref, onMounted, onUnmounted } from 'vue'

export function useNow() {
  const now = ref(Date.now())

  let interval: number

  onMounted(() => {
    interval = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })

  onUnmounted(() => {
    clearInterval(interval)
  })

  return { now }
}
