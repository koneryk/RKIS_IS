<template>
  <div class="dashboard">
    <h1>Панель управления</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Всего заявок</h3>
        <p class="stat-value"></p>
      </div>

      <div class="stat-card">
        <h3>На рассмотрении</h3>
        <p class="stat-value"></p>
      </div>

      <div class="stat-card">
        <h3>Одобрено</h3>
        <p class="stat-value"></p>
      </div>

      <div class="stat-card">
        <h3>Отказы</h3>
        <p class="stat-value"></p>
      </div>
    </div>

    <div class="recent-applications">

    </div>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0 40px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px;
  font-size: 1.1rem;
  opacity: 0.9;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}

.recent-applications {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f5f5f5;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.status-0 { background: #e3f2fd; color: #1976d2; }
.status-1 { background: #fff3e0; color: #f57c00; }
.status-2 { background: #e8f5e8; color: #388e3c; }
</style>