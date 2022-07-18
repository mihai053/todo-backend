const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Todo = require('../models/todo');
const User = require('../models/users');
const HttpError = require('./../models/http-error');

const getTodoById = async (req, res, next) => {
  const todoId = req.params.todoId;
  let todo;

  //findById does not return a real promise you need exec for real promise
  try {
    todo = await Todo.findById(todoId).exec();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a todo.',
      500
    );
    return next(error);
  }

  if (!todo) {
    const error = new HttpError(
      'Could not find todo for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ todo: todo.toObject({ getters: true }) });
};

const getTodoByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  //   de vazut aici
  let userWithTodos;
  try {
    userWithTodos = await User.findById(userId).populate('todos');
  } catch (err) {
    const error = new HttpError(
      'Fetching todos failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError('Could not find todos for the provided user id.', 404)
    );
  }

  res.json({
    todos: userWithTodos.todos.map((todo) => todo.toObject({ getters: true })),
  });
};

const createTodo = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description, address } = req.body;

  const createdTodo = new Todo({
    title,
    description,
    address,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId).exec();
  } catch (err) {
    const error = new HttpError('Creating todo failed, please try again.', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdTodo.save({ session: sess });
    user.todos.push(createdTodo);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError('Creating todo failed, please try again.', 500);
    return next(error);
  }

  res.status(201).json({ todo: createdTodo });
};

const updateTodo = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, description } = req.body;
  const todoId = req.params.todoid;

  let todo;
  try {
    todo = await Todo.findById(todoId).exec();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update todo.',
      500
    );
    return next(error);
  }

  if (todo.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this todo.', 401);
    return next(error);
  }

  todo.title = title;
  todo.description = description;

  try {
    await todo.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update todo.',
      500
    );
    return next(error);
  }

  res.status(200).json({ todo: todo.toObject({ getters: true }) });
};

const deleteTodo = async (req, res, next) => {
  const todoId = req.params.todoId;

  let todo;
  try {
    todo = await Todo.findById(todoId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete todo.',
      500
    );
    return next(error);
  }

  if (!todo) {
    const error = new HttpError('Could not find todo for this id.', 404);
    return next(error);
  }

  if (todo.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this todo.',
      401
    );
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    todo.creator.todos.pull(todo);
    await todo.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete todo.',
      500
    );
    return next(error);
  }

  res.status(200).json({ message: 'Deleted todo.' });
};
exports.getTodoById = getTodoById;
exports.getTodoByUserId = getTodoByUserId;
exports.createTodo = createTodo;
exports.deleteTodo = deleteTodo;
exports.updateTodo = updateTodo;
