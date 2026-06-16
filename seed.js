require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./src/models/User');
const Column = require('./src/models/Column');
const Task = require('./src/models/Task');

const seedDatabase = async () => {
  try {
    // 1. Connect to DB
    await connectDB();

    // 2. Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Column.deleteMany();
    await Task.deleteMany();

    // 3. Create Demo Users
    console.log('Creating users...');
    const user1 = await User.create({ name: 'Demo User 1' });
    const user2 = await User.create({ name: 'Demo User 2' });

    // 4. Create Columns for User 1
    console.log('Creating columns and tasks for User 1...');
    const u1_col1 = await Column.create({ name: 'To Do', order: 1, user_id: user1._id });
    const u1_col2 = await Column.create({ name: 'In Progress', order: 2, user_id: user1._id });
    const u1_col3 = await Column.create({ name: 'Done', order: 3, user_id: user1._id });

    // Create Tasks for User 1
    await Task.create({ title: 'Set up the project', description: 'Initialize Node.js project and install dependencies', column_id: u1_col3._id, user_id: user1._id, order: 1 });
    await Task.create({ title: 'Create database models', description: 'Schema for User, Column, Task', column_id: u1_col2._id, user_id: user1._id, order: 1 });
    await Task.create({ title: 'Implement authentication', description: 'Add API key based auth middleware', column_id: u1_col2._id, user_id: user1._id, order: 2 });
    await Task.create({ title: 'Write tests', description: 'Unit testing and integration testing', column_id: u1_col1._id, user_id: user1._id, order: 1 });
    await Task.create({ title: 'Deploy to production', column_id: u1_col1._id, user_id: user1._id, order: 2 });

    // 5. Create Columns for User 2
    console.log('Creating columns and tasks for User 2...');
    const u2_col1 = await Column.create({ name: 'Backlog', order: 1, user_id: user2._id });
    const u2_col2 = await Column.create({ name: 'Developing', order: 2, user_id: user2._id });

    // Create Tasks for User 2
    await Task.create({ title: 'Design system', description: 'Choose colors and typography', column_id: u2_col2._id, user_id: user2._id, order: 1 });
    await Task.create({ title: 'Fix navigation bug', description: 'Mobile menu not closing', column_id: u2_col1._id, user_id: user2._id, order: 1 });

    console.log('\n✅ Database seeded successfully!');
    
    console.log('\n=======================================');
    console.log('🔑 GENERATED API KEYS FOR TESTING');
    console.log('=======================================');
    console.log(`👤 User 1 (${user1.name}):`);
    console.log(`API Key: ${user1.apiKey}`);
    console.log('---------------------------------------');
    console.log(`👤 User 2 (${user2.name}):`);
    console.log(`API Key: ${user2.apiKey}`);
    console.log('=======================================\n');

    process.exit();
  } catch (error) {
    console.error('❌ Error while seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
