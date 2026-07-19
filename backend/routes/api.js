const express = require('express');
const router = express.Router();

// Middlewares
const { requireAdmin } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const bundleController = require('../controllers/bundleController');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const statsController = require('../controllers/statsController');
const ussdController = require('../controllers/ussdController');

/**
 * ==========================================
 * PUBLIC ENDPOINTS
 * ==========================================
 */

// Networks & Bundles
router.get('/networks', bundleController.getNetworks);
router.get('/bundles/:id', bundleController.getBundleById);
router.get('/bundles', bundleController.getBundles);

// Checkout & Orders
router.post('/orders', orderController.createOrder);
router.get('/orders/:id', orderController.getOrderById);
router.get('/orders/track', orderController.trackOrders);

// Payments (Paystack)
router.post('/payments/initialize', paymentController.initializePayment);
router.post('/payments/webhook', paymentController.handleWebhook);

// USSD
router.post('/ussd', ussdController.handleUssd);

/**
 * ==========================================
 * ADMIN AUTHENTICATION
 * ==========================================
 */
router.post('/admin/login', authController.login);

/**
 * ==========================================
 * PROTECTED ADMIN ENDPOINTS
 * ==========================================
 */

// Orders management
router.get('/admin/orders', requireAdmin, orderController.adminGetOrders);
router.post('/admin/orders/:id/retry', requireAdmin, orderController.retryOrder);
router.post('/admin/orders/:id/refund', requireAdmin, orderController.refundOrder);
router.post('/admin/orders/:id/complete', requireAdmin, orderController.manualCompleteOrder);

// Bundles management
router.get('/admin/bundles', requireAdmin, bundleController.adminGetBundles);
router.post('/admin/bundles', requireAdmin, bundleController.createBundle);
router.put('/admin/bundles/:id', requireAdmin, bundleController.updateBundle);
router.patch('/admin/bundles/:id', requireAdmin, bundleController.updateBundle);

// Networks management
router.put('/admin/networks/:id', requireAdmin, bundleController.updateNetwork);

// Reports & Statistics
router.get('/admin/stats', requireAdmin, statsController.getAdminStats);

module.exports = router;
