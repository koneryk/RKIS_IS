<template>
  <div class="financial-analysis">
    <div class="header">
      <h2>Финансовый анализ и прогнозирование</h2>
      <p class="idef0-badge">Прогностическая модель</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Загрузка...
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
            <span class="label">Сумма:</span>
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
        </div>
      </div>

      <form @submit.prevent="submitAnalysis" class="analysis-form card">
        <h3>Введите финансовые показатели</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Годовая выручка (₽)</label>
            <input type="number" v-model="form.revenue" required>
          </div>
          <div class="form-group">
            <label>Годовые расходы (₽)</label>
            <input type="number" v-model="form.expenses" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>EBIT (Прибыль до налогов и %)</label>
            <input type="number" v-model="form.ebit" required>
          </div>
          <div class="form-group">
            <label>Нераспределенная прибыль</label>
            <input type="number" v-model="form.retainedEarnings" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Текущий долг (₽)</label>
            <input type="number" v-model="form.debt" required>
          </div>
          <div class="form-group">
            <label>Активы (₽)</label>
            <input type="number" v-model="form.assets" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Оборотный капитал (₽)</label>
            <input type="number" v-model="form.workingCapital" required>
          </div>
          <div class="form-group">
            <label>Собственный капитал (₽)</label>
            <input type="number" v-model="form.equity" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Прогноз роста выручки (%)</label>
            <input type="number" v-model="form.revenueGrowth" step="0.1">
          </div>
          <div class="form-group">
            <label>Планируемые инвестиции (₽)</label>
            <input type="number" v-model="form.plannedInvestments">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Отрасль</label>
            <select v-model="form.industry" required>
              <option value="">Выберите отрасль</option>
              <option value="IT">IT / Технологии</option>
              <option value="retail">Розничная торговля</option>
              <option value="manufacturing">Производство</option>
              <option value="construction">Строительство</option>
              <option value="services">Услуги</option>
            </select>
          </div>
          <div class="form-group">
            <label>Кредитная история</label>
            <select v-model="form.creditHistory" required>
              <option value="excellent">Отличная</option>
              <option value="good">Хорошая</option>
              <option value="fair">Средняя</option>
              <option value="poor">Плохая</option>
            </select>
          </div>
        </div>

        <button type="button" class="btn-secondary" @click="calculateForecast">
          <i class="fas fa-chart-line"></i> Рассчитать прогноз
        </button>

        <div v-if="results" class="results">
          <h4>Результаты прогнозного анализа</h4>

          <div class="score-display" :class="scoreClass">
            <span class="score-label">Интегральный рейтинг:</span>
            <span class="score-value">{{ results.integralScore }}/100</span>
          </div>

          <div class="forecast-grid">
            <div class="forecast-section">
              <h5>Модель Альтмана (Z-Score)</h5>
              <div class="metric-group">
                <div class="metric">
                  <span>Z-Score:</span>
                  <strong :class="getZScoreClass(results.altmanZScore)">
                    {{ results.altmanZScore.toFixed(3) }}
                  </strong>
                </div>
                <div class="metric">
                  <span>Вероятность банкротства:</span>
                  <strong :class="getRiskClass(results.bankruptcyRisk)">
                    {{ results.bankruptcyRisk }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="forecast-section">
              <h5>DuPont Декомпозиция ROE</h5>
              <div class="metric-group">
                <div class="metric">
                  <span>ROE:</span>
                  <strong>{{ results.roe.toFixed(1) }}%</strong>
                </div>
                <div class="metric">
                  <span>Операционная эффективность:</span>
                  <strong>{{ results.operatingEfficiency.toFixed(2) }}</strong>
                </div>
                <div class="metric">
                  <span>Финансовый рычаг:</span>
                  <strong>{{ results.financialLeverage.toFixed(2) }}</strong>
                </div>
              </div>
            </div>

            <div class="forecast-section">
              <h5>Прогноз потребности в финансировании</h5>
              <div class="metric-group">
                <div class="metric">
                  <span>Потребность во внешнем финансировании:</span>
                  <strong :class="getFundingClass(results.externalFundingNeed)">
                    {{ formatAmount(results.externalFundingNeed) }}
                  </strong>
                </div>
                <div class="metric">
                  <span>Свободный денежный поток (FCF):</span>
                  <strong :class="getFCFClass(results.fcf)">
                    {{ formatAmount(results.fcf) }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="forecast-section">
              <h5>Ключевые финансовые коэффициенты</h5>
              <div class="metric-group">
                <div class="metric">
                  <span>Текущая ликвидность:</span>
                  <strong>{{ results.currentRatio.toFixed(2) }}</strong>
                </div>
                <div class="metric">
                  <span>Долговая нагрузка (D/E):</span>
                  <strong>{{ results.debtEquityRatio.toFixed(2) }}</strong>
                </div>
                <div class="metric">
                  <span>Рентабельность продаж:</span>
                  <strong>{{ results.profitMargin.toFixed(1) }}%</strong>
                </div>
                <div class="metric">
                  <span>Оборачиваемость активов:</span>
                  <strong>{{ results.assetTurnover.toFixed(2) }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="recommendation" :class="getRecommendationClass(results.recommendation)">
            <i class="fas fa-lightbulb"></i>
            <span>{{ results.recommendation }}</span>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="$router.back()">
            Отмена
          </button>
          <button type="submit" class="btn-primary" :disabled="!results">
            Сохранить и продолжить
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
const application = ref(null);
const results = ref(null);

const form = reactive({
  revenue: null,
  expenses: null,
  ebit: null,
  retainedEarnings: null,
  debt: null,
  assets: null,
  workingCapital: null,
  equity: null,
  revenueGrowth: 5,
  plannedInvestments: 0,
  industry: '',
  creditHistory: ''
});

onMounted(async () => {
  try {
    const response = await api.get(`/applications/${route.params.id}`);
    application.value = response.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});
 
const calculateForecast = () => {
  const revenue = Number(form.revenue) || 0;
  const expenses = Number(form.expenses) || 0;
  const ebit = Number(form.ebit) || 0;
  const retainedEarnings = Number(form.retainedEarnings) || 0;
  const debt = Number(form.debt) || 0;
  const assets = Number(form.assets) || 0;
  const workingCapital = Number(form.workingCapital) || 0;
  const equity = Number(form.equity) || 0;
  const revenueGrowth = Number(form.revenueGrowth) || 0;
  const plannedInvestments = Number(form.plannedInvestments) || 0;

  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  // Модель Альтмана
  const x1 = assets > 0 ? workingCapital / assets : 0;
  const x2 = assets > 0 ? retainedEarnings / assets : 0;
  const x3 = assets > 0 ? ebit / assets : 0;
  const x4 = debt > 0 ? equity / debt : 999;
  const x5 = assets > 0 ? revenue / assets : 0;

  const altmanZScore = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5;

  let bankruptcyRisk = '';
  if (altmanZScore < 1.23) bankruptcyRisk = 'Высокий риск банкротства';
  else if (altmanZScore < 2.9) bankruptcyRisk = 'Серая зона (неопределенность)';
  else bankruptcyRisk = 'Стабильное финансовое положение';

  // DuPont
  const netProfit = ebit * 0.8;
  const roe = equity > 0 ? (netProfit / equity) * 100 : 0;
  const operatingEfficiency = revenue > 0 ? netProfit / revenue : 0;
  const assetTurnover = assets > 0 ? revenue / assets : 0;
  const financialLeverage = equity > 0 ? assets / equity : 999;

  // Коэффициенты
  const currentRatio = (expenses / 12) > 0 ? workingCapital / (expenses / 12) : 0;
  const debtEquityRatio = equity > 0 ? debt / equity : 999;

  // Прогноз
  const forecastedRevenue = revenue * (1 + Math.min(revenueGrowth, 200) / 100);
  const forecastedProfit = forecastedRevenue - expenses;
  
  // формула потребности в финансировании
  const fundingNeed = (assets / revenue) * (forecastedRevenue - revenue) - 
                     (netProfit / revenue) * forecastedRevenue * 0.6;

  // FCF
  const depreciation = assets * 0.05;
  const changeInWC = workingCapital * 0.1;
  const fcf = netProfit + depreciation - plannedInvestments - changeInWC;

  // Скоринг
  let score = 0;
  
  // Альтман 
  if (altmanZScore >= 2.9) score += 35;
  else if (altmanZScore >= 1.23) score += 20;
  else score += 5;

  // ROE 
  if (roe >= 15) score += 25;
  else if (roe >= 10) score += 18;
  else if (roe >= 5) score += 10;
  else if (roe > 0) score += 5;

  // Ликвидность 
  if (currentRatio >= 2) score += 15;
  else if (currentRatio >= 1.5) score += 10;
  else if (currentRatio >= 1) score += 5;

  // Долговая нагрузка 
  if (debtEquityRatio <= 1) score += 10;
  else if (debtEquityRatio <= 2) score += 5;

  // Потребность в финансировании 
  if (fundingNeed <= 0) score += 10;
  else if (fundingNeed < revenue * 0.3) score += 5;

  // Кредитная история 
  const historyScores = { excellent: 5, good: 3, fair: 1, poor: 0 };
  score += historyScores[form.creditHistory] || 0;

  // Рекомендация
  let recommendation = '';
  if (score >= 75) {
    recommendation = 'Рекомендуется одобрение. Финансовое положение стабильное, прогнозы положительные.';
  } else if (score >= 55) {
    recommendation = 'Требуется дополнительный анализ. Есть риски, но потенциал для развития.';
  } else {
    recommendation = 'Рекомендуется отказ. Высокие финансовые риски, нестабильное положение.';
  }

  results.value = {
    integralScore: Math.min(Math.round(score), 100),
    altmanZScore,
    bankruptcyRisk,
    roe,
    operatingEfficiency,
    financialLeverage,
    assetTurnover,
    currentRatio,
    debtEquityRatio,
    profitMargin,
    externalFundingNeed: fundingNeed,
    fcf,
    recommendation
  };
};

const scoreClass = computed(() => {
  if (!results.value) return '';
  if (results.value.integralScore >= 70) return 'high';
  if (results.value.integralScore >= 50) return 'medium';
  return 'low';
});

const getZScoreClass = (zScore) => {
  if (zScore >= 2.9) return 'positive';
  if (zScore >= 1.23) return 'warning';
  return 'negative';
};

const getRiskClass = (risk) => {
  if (risk.includes('Стабильное')) return 'positive';
  if (risk.includes('Серая')) return 'warning';
  return 'negative';
};

const getFundingClass = (need) => {
  if (need <= 0) return 'positive';
  if (need < 1000000) return 'warning';
  return 'negative';
};

const getFCFClass = (fcf) => {
  if (fcf > 0) return 'positive';
  return 'negative';
};

const getRecommendationClass = (recommendation) => {
  if (recommendation.includes('одобрение')) return 'positive';
  if (recommendation.includes('дополнительный')) return 'warning';
  return 'negative';
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0 ₽';
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount)) + ' ₽';
};

const submitAnalysis = async () => {
  if (!results.value) {
    alert('Сначала рассчитайте прогноз!');
    return;
  }

  try {
    console.log('📤 Отправка финансового анализа для заявки:', route.params.id);
    
    const payload = {
      financial_score: results.value.integralScore,
      altman_z_score: results.value.altmanZScore,
      bankruptcy_risk: results.value.bankruptcyRisk,
      roe: results.value.roe,
      current_ratio: results.value.currentRatio,
      debt_equity_ratio: results.value.debtEquityRatio,
      profit_margin: results.value.profitMargin,
      external_funding_need: results.value.externalFundingNeed,
      fcf: results.value.fcf,
      recommendation: results.value.recommendation,
      revenue: form.revenue,
      expenses: form.expenses,
      ebit: form.ebit,
      retained_earnings: form.retainedEarnings,
      debt: form.debt,
      assets: form.assets,
      working_capital: form.workingCapital,
      equity: form.equity,
      revenue_growth: form.revenueGrowth,
      planned_investments: form.plannedInvestments,
      industry_risk: form.industry,
      credit_history: form.creditHistory
    };

    console.log('📦 Данные для отправки:', payload);

    const response = await api.post(`/applications/${route.params.id}/financial-analysis`, payload);
    
    console.log('✅ Финансовый анализ сохранен:', response.data);
    
    try {
      console.log('🔄 Переход на страницу оценки залога...');
      await router.push(`/applications/${route.params.id}/collateral`);
      console.log('✅ Переход выполнен успешно');
    } catch (navError) {
      console.error('Ошибка при переходе:', navError);
      await router.push(`/applications/${route.params.id}`);
    }

  } catch (err) {
    console.error('Ошибка при сохранении:', err);
    console.error('Ответ сервера:', err.response?.data);
    
    let errorMessage = 'Ошибка при сохранении финансового анализа';
    if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    } else if (err.response?.data?.details) {
      errorMessage = err.response.data.details;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    alert(`${errorMessage}`);
  }
};
</script>

<style scoped>
.financial-analysis {
  max-width: 1000px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.results {
  margin-top: 20px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.score-display {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 1.1rem;
}

.score-display.high { background: #d1fae5; color: #065f46; }
.score-display.medium { background: #fef3c7; color: #92400e; }
.score-display.low { background: #fee2e2; color: #991b1b; }

.forecast-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.forecast-section {
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.forecast-section h5 {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 0.95rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
}

.metric-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.9rem;
}

.metric span {
  color: #6b7280;
}

.metric strong {
  color: #1f2937;
}

.positive { color: #065f46; }
.warning { color: #92400e; }
.negative { color: #991b1b; }

.recommendation {
  margin-top: 20px;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.recommendation.positive {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.recommendation.warning {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.recommendation.negative {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .forecast-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>