const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import your User model
const User = require('./models/User');

async function testRegistration() {
  try {
    // Delete any existing test user
    await User.deleteOne({ user_id: 'test123' });
    
    // Create a password and hash it exactly as your registration does
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hashedPassword);
    
    // Create and save the user
    const user = new User({
      name: 'Test User',
      user_id: 'test123',
      roll_number: 'test123',
      password: hashedPassword,  // Use the hash directly
      role: 'student'
    });
    
    await user.save();
    console.log('User saved');
    
    // Retrieve the user and check the stored hash
    const savedUser = await User.findOne({ user_id: 'test123' });
    console.log('Retrieved hash:', savedUser.password);
    
    // Compare passwords
    console.log('Passwords match?', await bcrypt.compare(password, savedUser.password));
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Test error:', error);
    mongoose.disconnect();
  }
}

testRegistration();