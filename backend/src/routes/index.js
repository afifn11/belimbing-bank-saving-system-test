const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const CustomerController = require('../controllers/CustomerController');
const DepositoTypeController = require('../controllers/DepositoTypeController');
const AccountController = require('../controllers/AccountController');
const TransactionController = require('../controllers/TransactionController');

// ─── CUSTOMERS ────────────────────────────────────────────────
router.get('/customers', CustomerController.index);
router.get('/customers/:id', CustomerController.show);
router.post('/customers',
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  CustomerController.store
);
router.put('/customers/:id',
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  CustomerController.update
);
router.delete('/customers/:id', CustomerController.destroy);

// ─── DEPOSITO TYPES ───────────────────────────────────────────
router.get('/deposito-types', DepositoTypeController.index);
router.get('/deposito-types/:id', DepositoTypeController.show);
router.post('/deposito-types',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('yearly_return')
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Yearly return must be between 0.01 and 100'),
  ],
  validate,
  DepositoTypeController.store
);
router.put('/deposito-types/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('yearly_return')
      .optional()
      .isFloat({ min: 0.01, max: 100 })
      .withMessage('Yearly return must be between 0.01 and 100'),
  ],
  validate,
  DepositoTypeController.update
);
router.delete('/deposito-types/:id', DepositoTypeController.destroy);

// ─── ACCOUNTS ─────────────────────────────────────────────────
router.get('/accounts', AccountController.index);
router.get('/accounts/customer/:customerId', AccountController.byCustomer);
router.get('/accounts/:id', AccountController.show);
router.post('/accounts',
  [
    body('packet').trim().notEmpty().withMessage('Packet name is required'),
    body('customer_id').isInt({ min: 1 }).withMessage('Valid customer_id is required'),
    body('deposito_type_id').isInt({ min: 1 }).withMessage('Valid deposito_type_id is required'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be non-negative'),
  ],
  validate,
  AccountController.store
);
router.put('/accounts/:id',
  [
    body('packet').optional().trim().notEmpty().withMessage('Packet cannot be empty'),
  ],
  validate,
  AccountController.update
);
router.delete('/accounts/:id', AccountController.destroy);

// ─── TRANSACTIONS ─────────────────────────────────────────────
router.get('/transactions/account/:accountId', TransactionController.history);
router.post('/transactions/deposit',
  [
    body('account_id').isInt({ min: 1 }).withMessage('Valid account_id is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('transaction_date').isDate().withMessage('Valid date is required (YYYY-MM-DD)'),
  ],
  validate,
  TransactionController.deposit
);
router.post('/transactions/withdraw',
  [
    body('account_id').isInt({ min: 1 }).withMessage('Valid account_id is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('transaction_date').isDate().withMessage('Valid date is required (YYYY-MM-DD)'),
  ],
  validate,
  TransactionController.withdraw
);

module.exports = router;
