<template>
  <div class="application-details">
    <h1>Детали заявки #{{ applicationId }}</h1>
    <button @click="$router.back()">Назад к списку</button>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const applicationId = route.params.id;
</script>