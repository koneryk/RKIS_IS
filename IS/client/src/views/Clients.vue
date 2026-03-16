<template>
  <div class="clients">
    <h1>Справочник клиентов</h1>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка клиентов...
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
    </div>

    <div v-else>
      <div class="search-bar">
        <input
            v-model="search"
            type="text"
            placeholder="Поиск по названию или ИНН..."
            class="search-input"
        >
        <button class="btn-add" @click="addClient">+ Добавить клиента</button>
      </div>

      <table>
        <thead>
        <tr>
          <th>ID</th>
          <th>Наименование</th>
          <th>ИНН</th>
          <th>ОГРН</th>
          <th>Адрес</th>
          <th>Телефон</th>
          <th>Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="client in filteredClients" :key="client.id">
          <td>{{ client.id }}</td>
          <td>{{ client.name }}</td>
          <td>{{ client.inn }}</td>
          <td>{{ client.ogrn }}</td>
          <td>{{ client.address }}</td>
          <td>{{ client.phone }}</td>
          <td>
            <button class="btn-icon" @click="editClient(client.id)">✏️</button>
            <button class="btn-icon" @click="deleteClient(client.id)">🗑️</button>
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="filteredClients.length === 0 && !loading" class="empty-state">
        Клиенты не найдены
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const search = ref('');
const clients = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  await fetchClients();
});

const fetchClients = async () => {
  try {
    loading.value = true;
    error.value = null;

    let url = "http://localhost:3000/api/clients";
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error('Не авторизован');
    }

    let response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    clients.value = data;
    console.log('Клиенты загружены:', data);

  } catch (err) {
    console.error('Ошибка загрузки клиентов:', err);
    error.value = err.message || 'Не удалось загрузить клиентов';
  } finally {
    loading.value = false;
  }
};

const filteredClients = computed(() => {
  if (!search.value) return clients.value;

  const query = search.value.toLowerCase();
  return clients.value.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.inn?.includes(query) ||
      c.phone?.includes(query)
  );
});

const addClient = () => {
  router.push('/clients/new');
};

const editClient = (id) => {
  router.push(`/clients/${id}/edit`);
};

const deleteClient = async (id) => {
  if (!confirm('Удалить клиента?')) return;

  try {
    const token = localStorage.getItem("token");
    let response = await fetch(`http://localhost:3000/api/clients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      clients.value = clients.value.filter(c => c.id !== id);
    }
  } catch (err) {
    console.error('Ошибка удаления:', err);
  }
};
</script>

<style scoped>
.clients {
  padding: 20px;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #dc3545;
}

.error i, .loading i {
  margin-right: 8px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.btn-add {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.btn-add:hover {
  background: #45a049;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  margin: 0 4px;
  padding: 4px 8px;
  border-radius: 4px;
}

.btn-icon:hover {
  background: #f0f0f0;
  opacity: 1;
}
</style>