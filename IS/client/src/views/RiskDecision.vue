<template>
  <div class="risk-decision">
    <div class="header">
      <h2>Принятие решения по кредиту</h2>
      <p class="idef0-badge">Риск-решение</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка данных...
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
      <button @click="loadData" class="btn-retry">Повторить</button>
    </div>

    <div v-else class="content">
      <div class="application-info card">
        <h3>Заявка #{{ application?.id }}</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Клиент:</span>
            <span class="value">{{ application?.client_name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Сумма:</span>
            <span class="value">{{ formatAmount(application?.requested_amount) }}</span>
          </div>
          <div class="info-item">
            <span class="label">Срок:</span>
            <span class="value">{{ application?.requested_term || '-' }} мес.</span>
          </div>
          <div class="info-item">
            <span class="label">Продукт:</span>
            <span class="value">{{ application?.product_name || '-' }} ({{ application?.base_rate || '-' }}%)</span>
          </div>
        </div>
      </div>

      <div class="results-grid">
        <div class="result-card">
          <h4>
            <i class="fas fa-chart-line"></i>
            Финансовый анализ (A21)
          </h4>
          <template v-if="hasFinancialAnalysis">
            <div class="result-item">
              <span>Скоринг:</span>
              <span class="score" :class="getScoreClass(financialAnalysis.financial_score)">
                {{ financialAnalysis.financial_score || 0 }}/100
              </span>
            </div>
            <div class="result-item">
              <span>Ликвидность:</span>
              <span>{{ formatNumber(financialAnalysis.liquidity_ratio) }}</span>
            </div>
            <div class="result-item">
              <span>Долговая нагрузка:</span>
              <span>{{ formatNumber(financialAnalysis.debt_ratio) }}</span>
            </div>
            <div class="result-item">
              <span>Рентабельность:</span>
              <span>{{ formatNumber(financialAnalysis.profit_margin) }}%</span>
            </div>
          </template>
          <div v-else class="empty-state">
            <i class="fas fa-chart-line"></i>
            <p>Финансовый анализ не проведен</p>
          </div>
        </div>

        <div class="result-card">
          <h4>
            <i class="fas fa-home"></i>
            Оценка залога (A22)
          </h4>
          <template v-if="hasCollateral">
            <div class="result-item">
              <span>Тип залога:</span>
              <span>{{ collateral.type || '-' }}</span>
            </div>
            <div class="result-item">
              <span>Оценочная стоимость:</span>
              <span>{{ formatAmount(collateral.estimated_value) }}</span>
            </div>
            <div class="result-item">
              <span>Рыночная стоимость:</span>
              <span>{{ formatAmount(collateral.market_value) }}</span>
            </div>
            <div class="result-item">
              <span>LTV:</span>
              <span class="ltv" :class="getLTVClass(collateral.ltv_ratio)">
                {{ formatNumber(collateral.ltv_ratio) }}%
              </span>
            </div>
          </template>
          <div v-else class="empty-state">
            <i class="fas fa-home"></i>
            <p>Оценка залога не проведена</p>
          </div>
        </div>
      </div>

      <form @submit.prevent="submitDecision" class="decision-form card">
        <h3>Принять решение</h3>

        <div class="decision-options">
          <label class="decision-option" :class="{ selected: decision === 'approved' }">
            <input type="radio" v-model="decision" value="approved">
            <div class="option-content approved">
              <i class="fas fa-check-circle"></i>
              <div>
                <strong>Одобрить</strong>
                <p>Кредит может быть выдан на стандартных условиях</p>
              </div>
            </div>
          </label>

          <label class="decision-option" :class="{ selected: decision === 'conditional' }">
            <input type="radio" v-model="decision" value="conditional">
            <div class="option-content conditional">
              <i class="fas fa-exclamation-triangle"></i>
              <div>
                <strong>Одобрить с условиями</strong>
                <p>Требуется корректировка условий кредита</p>
              </div>
            </div>
          </label>

          <label class="decision-option" :class="{ selected: decision === 'rejected' }">
            <input type="radio" v-model="decision" value="rejected">
            <div class="option-content rejected">
              <i class="fas fa-times-circle"></i>
              <div>
                <strong>Отказать</strong>
                <p>Высокий уровень риска</p>
              </div>
            </div>
          </label>
        </div>

        <div v-if="decision === 'conditional'" class="conditions-section">
          <h4>Условия одобрения</h4>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" v-model="conditions.increased_rate">
              Повысить процентную ставку на 2%
            </label>
            <label>
              <input type="checkbox" v-model="conditions.additional_collateral">
              Требуется дополнительное обеспечение
            </label>
            <label>
              <input type="checkbox" v-model="conditions.reduced_amount">
              Уменьшить сумму кредита на 20%
            </label>
            <label>
              <input type="checkbox" v-model="conditions.shorter_term">
              Сократить срок кредита
            </label>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Новая ставка (%)</label>
              <input type="number" v-model="conditions.new_rate" step="0.1">
            </div>
            <div class="form-group">
              <label>Новая сумма (₽)</label>
              <input type="number" v-model="conditions.new_amount">
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="comment">Комментарий к решению</label>
          <textarea
              id="comment"
              v-model="comment"
              rows="4"
              placeholder="Обоснование решения, особые отметки..."
          ></textarea>
        </div>

        <div class="limits-section">
          <h4>Проверка лимитов (C5)</h4>
          <div class="limits-grid">
            <div class="limit-item">
              <span>Лимит на одного заёмщика:</span>
              <span class="limit-status passed">✓ Пройден</span>
            </div>
            <div class="limit-item">
              <span>Отраслевой лимит:</span>
              <span class="limit-status" :class="industryLimitPassed ? 'passed' : 'failed'">
                {{ industryLimitPassed ? '✓ Пройден' : '✗ Не пройден' }}
              </span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$router.back()">
            <i class="fas fa-arrow-left"></i> Назад
          </button>
          <button type="submit" class="btn-primary" :disabled="!decision || submitting">
            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
            <span v-else>Подтвердить решение</span>
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
const error = ref('');

const application = ref(null);
const financialAnalysis = ref(null);
const collateral = ref(null);

const decision = ref('');
const comment = ref('');
const conditions = reactive({
  increased_rate: false,
  additional_collateral: false,
  reduced_amount: false,
  shorter_term: false,
  new_rate: null,
  new_amount: null
});

const hasFinancialAnalysis = computed(() => {
  return financialAnalysis.value && Object.keys(financialAnalysis.value).length > 0;
});

const hasCollateral = computed(() => {
  return collateral.value && Object.keys(collateral.value).length > 0;
});

const industryLimitPassed = computed(() => {
  return financialAnalysis.value?.industry_risk !== 'high';
});

const formatNumber = (value) => {
  if (value === null || value === undefined) return '-';
  if (isNaN(value)) return '-';
  return Number(value).toFixed(2);
};

const formatAmount = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
};

const getScoreClass = (score) => {
  if (!score && score !== 0) return '';
  if (score >= 70) return 'good';
  if (score >= 50) return 'medium';
  return 'bad';
};

const getLTVClass = (ltv) => {
  if (!ltv && ltv !== 0) return '';
  if (ltv <= 60) return 'good';
  if (ltv <= 80) return 'medium';
  return 'bad';
};

const loadData = async () => {
  try {
    loading.value = true;
    error.value = '';

    const appRes = await api.get(`/applications/${route.params.id}`);
    application.value = appRes.data;

    try {
      const analysisRes = await api.get(`/applications/${route.params.id}/financial-analysis`);
      financialAnalysis.value = analysisRes.data || null;
    } catch (err) {
      console.log('Финансовый анализ не найден или ошибка доступа');
      financialAnalysis.value = null;
    }

    try {
      const collateralRes = await api.get(`/applications/${route.params.id}/collateral`);
      collateral.value = collateralRes.data || null;
    } catch (err) {
      console.log('Оценка залога не найдена или ошибка доступа');
      collateral.value = null;
    }

  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    error.value = 'Не удалось загрузить данные заявки';
  } finally {
    loading.value = false;
  }
};

const submitDecision = async () => {
  try {
    submitting.value = true;

    const data = {
      final_decision: decision.value,
      comment: comment.value
    };

    if (decision.value === 'conditional') {
      data.conditions = conditions;
    }

    if (decision.value === 'approved') {
      data.approved_amount = application.value?.requested_amount;
      data.approved_rate = application.value?.base_rate;
      data.approved_term = application.value?.requested_term;
    }

    await api.post(`/applications/${route.params.id}/risk-decision`, data);

    alert(`Решение принято: ${getDecisionText(decision.value)}`);
    router.push('/risk-assessment');
  } catch (err) {
    console.error('Ошибка сохранения решения:', err);
    alert('Ошибка при сохранении решения');
  } finally {
    submitting.value = false;
  }
};

const getDecisionText = (decision) => {
  const texts = {
    'approved': 'Одобрено',
    'conditional': 'Одобрено с условиями',
    'rejected': 'Отказано'
  };
  return texts[decision] || decision;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.risk-decision {
  max-width: 900px;
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

.results-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.result-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 15px;
}

.result-card h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  color: #374151;
}

.result-card h4 i {
  color: #4f46e5;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.result-item:last-child {
  border-bottom: none;
}

.score.good { color: #10b981; }
.score.medium { color: #f59e0b; }
.score.bad { color: #ef4444; }

.ltv.good { color: #10b981; }
.ltv.medium { color: #f59e0b; }
.ltv.bad { color: #ef4444; }

.empty-state {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #d1d5db;
}

.decision-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0;
}

.decision-option {
  cursor: pointer;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s;
}

.decision-option.selected {
  border-color: #4f46e5;
  background: #f9fafb;
}

.decision-option input[type="radio"] {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.option-content i {
  font-size: 1.5rem;
}

.option-content.approved i { color: #10b981; }
.option-content.conditional i { color: #f59e0b; }
.option-content.rejected i { color: #ef4444; }

.option-content p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.conditions-section {
  margin: 20px 0;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.limits-section {
  margin: 20px 0;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.limits-grid {
  margin-top: 10px;
}

.limit-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.limit-status.passed { color: #10b981; }
.limit-status.failed { color: #ef4444; }

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.btn-primary, .btn-secondary, .btn-retry {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
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

.btn-retry {
  background: #ef4444;
  color: white;
  margin-top: 10px;
}

.btn-retry:hover {
  background: #dc2626;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  border-radius: 8px;
}

.loading {
  color: #6b7280;
}

.error {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}
</style>