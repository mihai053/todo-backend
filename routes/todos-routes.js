const express = require('express');
const { check } = require('express-validator');

const todosController = require('./../controllers/todos-controller');

const router = express.Router();

router.get('/:todoId', todosController.getTodoById);

router.get('/user/:todoId', todosController.getTodoByUserId);

// middleware autorizare

router.post(
  '/',
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
  ],
  todosController.createTodo
);

router.patch(
  '/:todoId',
  [check('title').not().isEmpty(), check('description').isLength({ min: 5 })],
  todosController.updateTodo
);

router.delete('/:todoId', todosController.deleteTodo);

module.exports = router;
