const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { validateExpensePayload, validateObjectId } = require('../middleware/validate');

router.get('/', expenseController.getExpenses);
router.post('/', validateExpensePayload, expenseController.createExpense);
router.put('/:id', validateObjectId('id'), validateExpensePayload, expenseController.updateExpense);
router.delete('/:id', validateObjectId('id'), expenseController.deleteExpense);

module.exports = router;
