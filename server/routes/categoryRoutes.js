const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { validateObjectId } = require('../middleware/validate');

router.get('/', categoryController.getCategories);
router.post('/', categoryController.createCategory);
router.put('/:id', validateObjectId('id'), categoryController.updateCategory);
router.delete('/:id', validateObjectId('id'), categoryController.deleteCategory);

module.exports = router;
