<script setup>
import { ref, onMounted } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW()
const showUpdatePrompt = ref(false)
const isOnline = ref(navigator.onLine)

const updateApp = async () => {
  await updateServiceWorker(true)
  showUpdatePrompt.value = false
}

const closePrompt = () => {
  showUpdatePrompt.value = false
  needRefresh.value = false
}

onMounted(() => {
  window.addEventListener('online', () => {
    isOnline.value = true
  })

  window.addEventListener('offline', () => {
    isOnline.value = false
  })

  if (needRefresh.value) {
    showUpdatePrompt.value = true
  }

  if (offlineReady.value) {
    console.log('Приложение готово к офлайн-режиму')
  }
})
</script>

<template>
  <div class="pwa-status">
    <div v-if="!isOnline" class="offline-banner">
      ⚡ Вы работаете в офлайн-режиме
    </div>

    <div v-if="offlineReady" class="offline-ready">
      Приложение готово к работе без интернета
    </div>

    <div v-if="showUpdatePrompt || needRefresh" class="update-prompt">
      <div class="update-content">
        <p>Доступна новая версия приложения</p>
        <div class="update-actions">
          <button @click="updateApp" class="btn-update">
            Обновить
          </button>
          <button @click="closePrompt" class="btn-close">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.offline-banner {
  background: #ff9800;
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.offline-ready {
  background: #4caf50;
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  border-radius: 4px;
  margin: 1rem;
}

.update-prompt {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.update-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 320px;
}

.update-content p {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-weight: 500;
}

.update-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-update {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
}

.btn-update:hover {
  background: #4338ca;
}

.btn-close {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
}

.btn-close:hover {
  background: #e5e7eb;
}

@keyframes slideIn {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .update-prompt {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  .update-content {
    max-width: none;
  }
}
</style>