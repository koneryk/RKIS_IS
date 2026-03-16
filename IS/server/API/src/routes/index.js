const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const applicationController = require('../controllers/applicationController');
const productController = require('../controllers/productController');
const clientController = require('../controllers/clientController');
const contractController = require('../controllers/contractController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.post('/auth/login', userController.login);
router.post('/auth/register', userController.register);

router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products', productController.createProduct);

router.use(authMiddleware);

router.get('/auth/me', userController.getMe);

router.get('/users', roleMiddleware(['admin']), userController.getUsers);
router.post('/users', roleMiddleware(['admin']), userController.createUser);
router.put('/users/:id', roleMiddleware(['admin']), userController.updateUser);
router.delete('/users/:id', roleMiddleware(['admin']), userController.deleteUser);

router.get('/clients', clientController.getClients);
router.get('/clients/:id', clientController.getClientById);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);

router.get('/applications', applicationController.getApplications);
router.get('/applications/:id', applicationController.getApplicationById);
router.post('/applications', applicationController.createApplication);
router.put('/applications/:id', applicationController.updateApplication);
router.delete('/applications/:id', applicationController.deleteApplication);

router.get('/applications/:id/financial-analysis', applicationController.getFinancialAnalysis);
router.post('/applications/:id/financial-analysis', applicationController.saveFinancialAnalysis);
router.get('/applications/:id/collateral', applicationController.getCollateral);
router.post('/applications/:id/collateral', applicationController.saveCollateral);
router.get('/applications/:id/risk-decision', applicationController.getRiskDecision);
router.post('/applications/:id/risk-decision', applicationController.saveRiskDecision);

router.get('/applications/:id/legal-check', applicationController.getLegalCheck);
router.post('/applications/:id/legal-check', applicationController.saveLegalCheck);

router.get('/applications/:id/approvals', applicationController.getApprovals);
router.post('/applications/:id/approval', applicationController.saveApproval);

router.get('/contracts', contractController.getContracts);
router.get('/contracts/:id', contractController.getContractById);
router.post('/applications/:id/contract', contractController.createContract);
router.put('/contracts/:id', contractController.updateContract);
router.delete('/contracts/:id', contractController.deleteContract);

router.get('/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

module.exports = router;