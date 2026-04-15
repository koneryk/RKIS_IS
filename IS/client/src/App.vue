<script setup>
import PWAStatus from '../src/components/PWAStatus.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <PWAStatus />

    <div class="app-container">
      <nav class="main-nav">
        <router-link to="/" class="nav-link">Дашборд</router-link>
        <router-link to="/clients" class="nav-link">Клиенты</router-link>
        <router-link to="/applications" class="nav-link">Заявки</router-link>
        <router-link to="/risk-assessment" class="nav-link">Оценка рисков</router-link>
        <router-link to="/contracts" class="nav-link">Договоры</router-link>
      </nav>

      <main class="main-content">
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
  background: #f9fafb;
}

.app-container {
  //max-width: 1400px;
  //margin: 0 auto;
  //padding: 2rem;
}

.main-nav {
  display: flex;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-link {
  text-decoration: none;
  color: #4b5563;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
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
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 70vh;
}
</style>