<script setup>
import PWAStatus from '../src/components/PWAStatus.vue'
import { RouterView } from 'vue-router'

</script>

<template>
  <div id="app">
    <PWAStatus />

    <div class="app-container" :class="{ 'no-padding': $route.meta.hideNavbar }">
      <nav v-if="!$route.meta.hideNavbar" class="main-nav">
        <router-link to="/" class="nav-link">Дашборд</router-link>
        <router-link to="/clients" class="nav-link">Клиенты</router-link>
        <router-link to="/applications" class="nav-link">Заявки</router-link>
        <router-link to="/risk-assessment" class="nav-link">Оценка рисков</router-link>
        <router-link to="/contracts" class="nav-link">Договоры</router-link>
      </nav>

      <main class="main-content" :class="{ 'full-height': $route.meta.hideNavbar }">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f0f2f5;
  min-height: 100vh;
}

#app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem;
  min-height: 100vh;
  background: #f0f2f5;
}

.app-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.app-container.no-padding {
  padding: 0;
  gap: 0;
  margin: -1.5rem;
}

.main-nav {
  display: flex;
  gap: 0.5rem;
  background: white;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  border: 1px solid #e5e7eb;
}

.nav-link {
  text-decoration: none;
  color: #4b5563;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  transition: all 0.2s;
  font-size: 0.95rem;
  font-weight: 500;
}

.nav-link:hover {
  background: #f3f4f6;
  color: #4f46e5;
}

.nav-link.router-link-active {
  background: #4f46e5;
  color: white;
}

.main-content {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  min-height: 70vh;
  border: 1px solid #e5e7eb;
}

.main-content.full-height {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: none;
  min-height: 100vh;
  border-radius: 0;
}

@media (max-width: 768px) {
  #app {
    padding: 1rem;
  }

  .app-container.no-padding {
    margin: -1rem;
  }

  .main-nav {
    padding: 0.5rem;
    gap: 0.25rem;
  }

  .nav-link {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }

  .main-content {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  #app {
    padding: 0.5rem;
  }

  .app-container.no-padding {
    margin: -0.5rem;
  }

  .main-nav {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-link {
    text-align: center;
  }

  .main-content {
    padding: 0.75rem;
  }
}
</style>