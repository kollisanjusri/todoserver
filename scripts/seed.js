const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../config.env' });

const User = require('../models/User');
const Todo = require('../models/Todo');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Todo.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123'
      }
    ]);
    console.log('Created sample users');

    // Create sample todos
    const sampleTodos = [
      {
        title: 'Complete project proposal',
        description: 'Write a detailed project proposal for the new client',
        status: 'In Progress',
        category: 'Work',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        user: users[0]._id
      },
      {
        title: 'Buy groceries',
        description: 'Milk, bread, eggs, and vegetables',
        status: 'Pending',
        category: 'Personal',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        user: users[0]._id
      },
      {
        title: 'Call dentist',
        description: 'Schedule annual checkup',
        status: 'Pending',
        category: 'Health',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        user: users[0]._id
      },
      {
        title: 'Review code changes',
        description: 'Review pull request #123 for the authentication module',
        status: 'Completed',
        category: 'Work',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        user: users[0]._id
      },
      {
        title: 'Plan weekend trip',
        description: 'Research destinations and book accommodation',
        status: 'Pending',
        category: 'Personal',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        user: users[1]._id
      },
      {
        title: 'Update resume',
        description: 'Add recent projects and skills',
        status: 'In Progress',
        category: 'Career',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        user: users[1]._id
      }
    ];

    await Todo.create(sampleTodos);
    console.log('Created sample todos');

    console.log('Database seeded successfully!');
    console.log('\nSample login credentials:');
    console.log('Email: john@example.com, Password: password123');
    console.log('Email: jane@example.com, Password: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedData();





