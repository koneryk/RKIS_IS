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

          <!-- ====== МАТРИЦА РИСКОВ ====== -->
          <div class="risk-matrix-section">
            <h4>Двумерная матрица рисков</h4>
            <p class="matrix-description">
              Оценка риска по двум осям: <strong>Вероятность</strong> (0-4) и <strong>Влияние</strong> (0-4)
            </p>

            <div class="matrix-wrapper">
              <div class="matrix-labels">
                <div class="label-y">Влияние ↑</div>
                <div class="label-x">Вероятность →</div>
              </div>

              <table class="risk-matrix">
                <tr v-for="row in 5" :key="'row-' + row">
                  <td v-for="col in 5" :key="'col-' + col"
                      :class="getMatrixCellClass(row, col)"
                      class="matrix-cell">
                    <span class="cell-value">{{ (row - 1) * (col - 1) }}</span>
                    <span v-if="isActiveCell(row, col)" class="cell-marker">●</span>
                  </td>
                </tr>
              </table>

              <div class="matrix-legend">
                <div class="legend-item">
                  <span class="color-box green"></span>
                  <span>Низкий риск (0-4)</span>
                </div>
                <div class="legend-item">
                  <span class="color-box yellow"></span>
                  <span>Средний риск (5-9)</span>
                </div>
                <div class="legend-item">
                  <span class="color-box red"></span>
                  <span>Высокий риск (10-16)</span>
                </div>
                <div class="legend-item">
                  <span class="color-box active"></span>
                  <span>Текущая позиция</span>
                </div>
              </div>
            </div>

            <div class="matrix-result" :class="results.riskMatrix.color">
              <div class="result-header">
                <span class="result-icon">
                  <i v-if="results.riskMatrix.color === 'green'" class="fas fa-check-circle"></i>
                  <i v-else-if="results.riskMatrix.color === 'yellow'" class="fas fa-exclamation-triangle"></i>
                  <i v-else class="fas fa-times-circle"></i>
                </span>
                <span class="result-category">{{ results.riskMatrix.category }}</span>
                <span class="result-score">{{ results.riskMatrix.riskLevel }} из 16</span>
              </div>
              <div class="result-details">
                <div class="detail-item">
                  <span class="detail-label">Вероятность:</span>
                  <span class="detail-value">{{ results.riskMatrix.probability }}/4</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (results.riskMatrix.probability / 4 * 100) + '%' }"></div>
                  </div>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Влияние:</span>
                  <span class="detail-value">{{ results.riskMatrix.impact }}/4</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (results.riskMatrix.impact / 4 * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
              <div class="result-recommendation">
                <i class="fas fa-lightbulb"></i>
                <span>{{ results.riskMatrix.recommendation }}</span>
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

const calculateRiskMatrix = (altmanZScore, currentRatio, debtEquityRatio, profitMargin, revenue, debt) => {
  // 1. ОЦЕНКА ВЕРОЯТНОСТИ (0-4)
  let probability = 0;
  
  // Факторы, увеличивающие вероятность дефолта
  if (altmanZScore < 1.23) probability += 2;
  else if (altmanZScore < 2.9) probability += 1;
  
  if (currentRatio < 1) probability += 1;
  else if (currentRatio < 1.5) probability += 0.5;
  
  if (debtEquityRatio > 2) probability += 1;
  else if (debtEquityRatio > 1) probability += 0.5;
  
  // Ограничиваем максимум 4
  probability = Math.min(Math.round(probability), 4);
  
  // 2. ОЦЕНКА ВЛИЯНИЯ (0-4)
  let impact = 0;
  
  const requestedAmount = Number(application.value?.requested_amount) || 0;
  const debtToRevenue = revenue > 0 ? debt / revenue : 0;
  
  // Размер кредита относительно выручки
  if (requestedAmount > revenue * 0.5) impact += 2;
  else if (requestedAmount > revenue * 0.3) impact += 1;
  
  // Долговая нагрузка
  if (debtToRevenue > 0.5) impact += 1;
  else if (debtToRevenue > 0.3) impact += 0.5;
  
  // Низкая прибыльность
  if (profitMargin < 5) impact += 1;
  else if (profitMargin < 10) impact += 0.5;
  
  // Ограничиваем максимум 4
  impact = Math.min(Math.round(impact), 4);
  
  // 3. РАСЧЕТ УРОВНЯ РИСКА
  const riskLevel = probability * impact;
  
  // 4. ОПРЕДЕЛЕНИЕ КАТЕГОРИИ
  let category = '';
  let color = '';
  let recommendation = '';
  
  if (riskLevel <= 4) {
    category = 'Низкий риск';
    color = 'green';
    recommendation = 'Рекомендуется одобрение. Финансовое положение стабильное.';
  } else if (riskLevel <= 9) {
    category = 'Средний риск';
    color = 'yellow';
    recommendation = 'Требуется дополнительный анализ. Есть риски, но потенциал для развития.';
  } else {
    category = 'Высокий риск';
    color = 'red';
    recommendation = 'Рекомендуется отказ. Высокие финансовые риски.';
  }
  
  return {
    probability,
    impact,
    riskLevel,
    category,
    color,
    recommendation,
    // Для позиционирования в матрице (1-5, так как в матрице 5x5)
    matrixRow: impact + 1,
    matrixCol: probability + 1
  };
};

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

  const riskMatrix = calculateRiskMatrix(
    altmanZScore, 
    currentRatio, 
    debtEquityRatio, 
    profitMargin, 
    revenue, 
    debt
  );

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
    recommendation,
    riskMatrix 
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

const getMatrixCellClass = (row, col) => {
  const value = (row - 1) * (col - 1);
  
  let colorClass = '';
  if (value <= 4) colorClass = 'cell-green';
  else if (value <= 9) colorClass = 'cell-yellow';
  else colorClass = 'cell-red';
  
  const isActive = isActiveCell(row, col);
  
  return {
    [colorClass]: true,
    'cell-active': isActive
  };
};

const isActiveCell = (row, col) => {
  if (!results.value?.riskMatrix) return false;
  const { matrixRow, matrixCol } = results.value.riskMatrix;
  return row === matrixRow && col === matrixCol;
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
      risk_probability: results.value.riskMatrix.probability,
      risk_impact: results.value.riskMatrix.impact,
      risk_level: results.value.riskMatrix.riskLevel,
      risk_category: results.value.riskMatrix.category,
      risk_recommendation: results.value.riskMatrix.recommendation,
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
    
    console.log('Финансовый анализ сохранен:', response.data);
    
    try {
      console.log('Переход на страницу оценки залога...');
      await router.push(`/applications/${route.params.id}/collateral`);
      console.log('Переход выполнен успешно');
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

.risk-matrix-section {
  margin-top: 25px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.risk-matrix-section h4 {
  margin: 0 0 5px 0;
  color: #1f2937;
}

.matrix-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.matrix-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.matrix-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 350px;
  margin-bottom: 5px;
}

.label-y {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.label-x {
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.risk-matrix {
  border-collapse: collapse;
  width: 100%;
  max-width: 350px;
  table-layout: fixed;
}

.matrix-cell {
  width: 60px;
  height: 60px;
  text-align: center;
  border: 1px solid #e5e7eb;
  font-weight: bold;
  font-size: 16px;
  position: relative;
  transition: all 0.3s ease;
}

.matrix-cell .cell-value {
  display: block;
  font-size: 18px;
}

.matrix-cell .cell-marker {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 16px;
  color: #4f46e5;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.cell-green {
  background-color: #d1fae5;
  color: #065f46;
}

.cell-yellow {
  background-color: #fef3c7;
  color: #92400e;
}

.cell-red {
  background-color: #fee2e2;
  color: #991b1b;
}

.cell-active {
  border: 3px solid #4f46e5;
  box-shadow: 0 0 15px rgba(79, 70, 229, 0.4);
  transform: scale(1.05);
  z-index: 10;
  position: relative;
}

.matrix-legend {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #374151;
}

.color-box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.color-box.green { background-color: #d1fae5; }
.color-box.yellow { background-color: #fef3c7; }
.color-box.red { background-color: #fee2e2; }
.color-box.active {
  background-color: white;
  border: 2px solid #4f46e5;
  box-shadow: 0 0 8px rgba(79, 70, 229, 0.3);
}

.matrix-result {
  margin-top: 15px;
  padding: 15px 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 350px;
}

.matrix-result.green {
  background: #d1fae5;
  border: 2px solid #065f46;
}

.matrix-result.yellow {
  background: #fef3c7;
  border: 2px solid #92400e;
}

.matrix-result.red {
  background: #fee2e2;
  border: 2px solid #991b1b;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: bold;
}

.result-icon {
  font-size: 1.3rem;
}

.matrix-result.green .result-icon { color: #065f46; }
.matrix-result.yellow .result-icon { color: #92400e; }
.matrix-result.red .result-icon { color: #991b1b; }

.result-category {
  flex: 1;
}

.result-score {
  font-size: 0.9rem;
  opacity: 0.8;
}

.result-details {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-label {
  font-size: 0.9rem;
  min-width: 80px;
}

.detail-value {
  font-weight: 600;
  min-width: 40px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.5);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.matrix-result.green .progress-fill { background: #065f46; }
.matrix-result.yellow .progress-fill { background: #92400e; }
.matrix-result.red .progress-fill { background: #991b1b; }

.result-recommendation {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

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

  .matrix-cell {
    width: 45px;
    height: 45px;
    font-size: 14px;
  }

  .matrix-cell .cell-value {
    font-size: 14px;
  }

  .risk-matrix {
    max-width: 250px;
  }

  .matrix-result {
    max-width: 100%;
  }

  .matrix-legend {
    gap: 10px;
  }
}
</style>