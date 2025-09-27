const express = require('express');
const { body, validationResult } = require('express-validator');
const Todo = require('../models/Todo');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/todos
// @desc    Get all todos for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build filter object
    const filter = { user: req.user._id };
    
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    if (category && category !== 'All') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const todos = await Todo.find(filter).sort(sort);
    
    res.json({
      todos,
      total: todos.length
    });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ message: 'Server error while fetching todos' });
  }
});

// @route   GET /api/todos/:id
// @desc    Get single todo
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json({ todo });
  } catch (error) {
    console.error('Get todo error:', error);
    res.status(500).json({ message: 'Server error while fetching todo' });
  }
});

// @route   POST /api/todos
// @desc    Create a new todo
// @access  Private
router.post('/', [
  auth,
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, status = 'Pending', category, dueDate } = req.body;
    
    const todo = new Todo({
      title,
      description,
      status,
      category,
      dueDate: dueDate ? new Date(dueDate) : null,
      user: req.user._id
    });

    await todo.save();
    
    res.status(201).json({
      message: 'Todo created successfully',
      todo
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ message: 'Server error while creating todo' });
  }
});

// @route   PUT /api/todos/:id
// @desc    Update a todo
// @access  Private
router.put('/:id', [
  auth,
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']).withMessage('Invalid status'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, status, category, dueDate } = req.body;
    
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    // Update fields if provided
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (status !== undefined) todo.status = status;
    if (category !== undefined) todo.category = category;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : null;

    await todo.save();
    
    res.json({
      message: 'Todo updated successfully',
      todo
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ message: 'Server error while updating todo' });
  }
});

// @route   DELETE /api/todos/:id
// @desc    Delete a todo
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ message: 'Server error while deleting todo' });
  }
});

// @route   GET /api/todos/stats/summary
// @desc    Get todo statistics
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const stats = await Todo.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    };

    stats.forEach(stat => {
      summary.total += stat.count;
      summary[stat._id.toLowerCase().replace(' ', '')] = stat.count;
    });

    res.json({ summary });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;



