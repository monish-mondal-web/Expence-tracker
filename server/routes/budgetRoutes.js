const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { validateBudgetPayload, validateObjectId } = require('../middleware/validate');

router.get('/', budgetController.getMonthlyBudget);
router.post('/', validateBudgetPayload, budgetController.setMonthlyBudget);
router.put('/:id', validateObjectId('id'), validateBudgetPayload, budgetController.updateMonthlyBudget);
router.delete('/:id', validateObjectId('id'), budgetController.resetMonthlyBudget);

module.exports = router;
