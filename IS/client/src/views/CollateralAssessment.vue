<template>
  <div class="collateral-assessment">
    <div class="header">
      <h2>Оценка залогового обеспечения</h2>
      <p class="idef0-badge">Оценка залога</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка данных...
    </div>

    <div v-else class="content">
      <div class="application-info card">
        <h3>Заявка #{{ application?.id }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Клиент:</span>
            <span class="value">{{ application?.client_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Сумма кредита:</span>
            <span class="value">{{ formatAmount(application?.requested_amount) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Срок:</span>
            <span class="value">{{ application?.requested_term }} мес.</span>
          </div>
          <div class="info-item">
            <span class="label">Продукт:</span>
            <span class="value">{{ application?.product_name }}</span>
          </div>
          <div class="info-item" v-if="application?.requires_collateral">
            <span class="label">Требование залога:</span>
            <span class="value required">Обязателен</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitAssessment" class="assessment-form card">
        <h3>Данные залогового обеспечения</h3>

        <div class="form-group">
          <label for="type">Тип залога <span class="required">*</span></label>
          <select id="type" v-model="form.type" required>
            <option value="">Выберите тип залога</option>
            <option value="real_estate">Недвижимость</option>
            <option value="vehicle">Транспортное средство</option>
            <option value="equipment">Оборудование</option>
            <option value="goods">Товары в обороте</option>
            <option value="property_rights">Имущественные права</option>
            <option value="guarantee">Банковская гарантия</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Описание залога <span class="required">*</span></label>
          <textarea
              id="description"
              v-model="form.description"
              rows="3"
              required
              placeholder="Подробное описание предмета залога, его состояние, местоположение и т.д."
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="estimatedValue">Оценочная стоимость (₽) <span class="required">*</span></label>
            <input
                type="number"
                id="estimatedValue"
                v-model.number="form.estimated_value"
                required
                min="0"
                step="1000"
            >
          </div>
          <div class="form-group">
            <label for="marketValue">Рыночная стоимость (₽) <span class="required">*</span></label>
            <input
                type="number"
                id="marketValue"
                v-model.number="form.market_value"
                required
                min="0"
                step="1000"
            >
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="valuationDate">Дата оценки</label>
            <input
                type="date"
                id="valuationDate"
                v-model="form.valuation_date"
            >
          </div>
          <div class="form-group">
            <label for="appraiser">Оценщик</label>
            <input
                type="text"
                id="appraiser"
                v-model="form.appraiser"
                placeholder="ФИО или название организации"
            >
          </div>
        </div>


        <div class="ltv-calculator" v-if="form.market_value > 0">
          <h4>Расчет LTV (Loan-to-Value)</h4>
          <div class="ltv-display">
            <div class="ltv-value" :class="ltvClass">
              {{ ltvRatio.toFixed(2) }}%
            </div>
            <div class="ltv-description">
              <p v-if="ltvRatio <= 60" class="good">
                <i class="fas fa-check-circle"></i> Низкий уровень риска (LTV ≤ 60%)
              </p>
              <p v-else-if="ltvRatio <= 80" class="medium">
                <i class="fas fa-exclamation-triangle"></i> Средний уровень риска (60% < LTV ≤ 80%)
              </p>
              <p v-else class="bad">
                <i class="fas fa-times-circle"></i> Высокий уровень риска (LTV > 80%)
              </p>
            </div>
          </div>
        </div>

      
        <div class="documents-section">
          <h4>Документы на залог</h4>
          <div class="file-upload" @click="triggerFileUpload">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Нажмите для загрузки документов</p>
            <input
                type="file"
                ref="fileInput"
                multiple
                @change="handleFileSelect"
                style="display: none"
            >
          </div>
          <div v-if="uploadedFiles.length" class="file-list">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="file-item">
              <i class="fas fa-file-pdf"></i>
              <span>{{ file.name }}</span>
              <span class="file-size">{{ (file.size / 1024).toFixed(1) }} KB</span>
              <button type="button" @click="removeFile(index)" class="btn-remove">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="comments">Комментарий</label>
          <textarea
              id="comments"
              v-model="form.comments"
              rows="2"
              placeholder="Дополнительная информация о залоге..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$router.back()">
            <i class="fas fa-arrow-left"></i> Назад
          </button>
          <button type="submit" class="btn-primary" :disabled="submitting || !isValid">
            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
            <span v-else>Сохранить и перейти к решению</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const submitting = ref(false);
const application = ref(null);
const uploadedFiles = ref([]);
const fileInput = ref(null);

const form = reactive({
  type: '',
  description: '',
  estimated_value: null,
  market_value: null,
  valuation_date: '',
  appraiser: '',
  comments: ''
});

onMounted(async () => {
  try {
    const response = await api.get(`/applications/${route.params.id}`);
    application.value = response.data;
  } catch (err) {
    console.error('Ошибка загрузки заявки:', err);
  } finally {
    loading.value = false;
  }
});

const ltvRatio = computed(() => {
  if (!application.value?.requested_amount || !form.market_value) return 0;
  return (application.value.requested_amount / form.market_value) * 100;
});

const ltvClass = computed(() => {
  const ltv = ltvRatio.value;
  if (ltv <= 60) return 'good';
  if (ltv <= 80) return 'medium';
  return 'bad';
});

const isValid = computed(() => {
  return form.type &&
      form.description &&
      form.estimated_value > 0 &&
      form.market_value > 0;
});

const formatAmount = (amount) => {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₽';
};

const triggerFileUpload = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  uploadedFiles.value.push(...files);
};

const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
};

const submitAssessment = async () => {
  try {
    submitting.value = true;

    const data = {
      ...form,
      ltv_ratio: ltvRatio.value
    };

    await api.post(`/applications/${route.params.id}/collateral`, data);

    if (uploadedFiles.value.length > 0) {
      const formData = new FormData();
      uploadedFiles.value.forEach(file => {
        formData.append('documents', file);
      });
      await api.post(`/applications/${route.params.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    router.push(`/applications/${route.params.id}/risk-decision`);
  } catch (err) {
    console.error('Ошибка сохранения:', err);
    alert('Ошибка при сохранении оценки залога');
  } finally {
    submitting.value = false;
  }
};

</script>

<style scoped>
.collateral-assessment {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.idef0-badge {
  display: inline-block;
  background: #4f46e5;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item .label {
  font-size: 0.9rem;
  color: #6b7280;
}

.info-item .value {
  font-weight: 600;
  color: #1f2937;
}

.info-item .value.required {
  color: #dc2626;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.required {
  color: #dc2626;
}

.ltv-calculator {
  margin: 20px 0;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.ltv-display {
  text-align: center;
}

.ltv-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 10px 0;
}

.ltv-value.good { color: #10b981; }
.ltv-value.medium { color: #f59e0b; }
.ltv-value.bad { color: #ef4444; }

.ltv-description p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1rem;
}

.ltv-description .good { color: #10b981; }
.ltv-description .medium { color: #f59e0b; }
.ltv-description .bad { color: #ef4444; }

.documents-section {
  margin: 20px 0;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.file-upload {
  border: 2px dashed #e5e7eb;
  border-radius: 6px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.file-upload:hover {
  border-color: #4f46e5;
  background: #f3f4f6;
}

.file-upload i {
  font-size: 2rem;
  color: #4f46e5;
  margin-bottom: 10px;
}

.file-list {
  margin-top: 15px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 5px;
}

.file-item i {
  color: #ef4444;
}

.file-size {
  margin-left: auto;
  color: #6b7280;
  font-size: 0.9rem;
}

.btn-remove {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
}

.btn-remove:hover {
  color: #ef4444;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>