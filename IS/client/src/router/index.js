import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Dashboard from '../views/Dashboard.vue';
import Clients from '../views/Clients.vue';
import Applications from '../views/Applications.vue';
import ApplicationDetails from '../views/ApplicationDetails.vue';
import ApplicationForm from '../views/ApplicationForm.vue';
import Contracts from "../views/Contracts.vue";
import RiskAssessment from "../views/RiskAssessment.vue";
import FinancialAnalysis from "../views/FinancialAnalysis.vue";
import CollateralAssessment from "../views/CollateralAssessment.vue";
import RiskDecision from "../views/RiskDecision.vue";

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresGuest: true }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/clients',
        name: 'Clients',
        component: Clients,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications',
        name: 'Applications',
        component: Applications,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications/new',
        name: 'NewApplication',
        component: ApplicationForm,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications/:id',
        name: 'ApplicationDetails',
        component: ApplicationDetails,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications/:id/edit',
        name: 'EditApplication',
        component: ApplicationForm,
        meta: { requiresAuth: true }
    },
    {
        path: '/contracts',
        name: 'Contracts',
        component: Contracts,
        meta: { requiresAuth: true }
    },
    {
        path: '/risk-assessment',
        name: 'RiskAssessment',
        component: RiskAssessment,
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    },
    {
        path: '/risk-assessment',
        name: 'RiskAssessment',
        component: RiskAssessment,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications/:id/financial-analysis',
        name: 'FinancialAnalysis',
        component: FinancialAnalysis,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications/:id/collateral',
        name: 'CollateralAssessment',
        component: CollateralAssessment,
        meta: { requiresAuth: true }
    },
    {
        path: '/applications/:id/risk-decision',
        name: 'RiskDecision',
        component: RiskDecision,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.meta.requiresGuest && token) {
        next('/');
    } else {
        next();
    }
});

export default router;