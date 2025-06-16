const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user_id: { type: String, required: true, unique: true },
    roll_number: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'faculty', 'student'],
        default: 'student'
    },
    batch: {
        type: String,
        enum: ['N', 'P', 'Q'],
        // Only required for students, but do NOT set required here to avoid issues for faculty/admin
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        // Only required for students, but do NOT set required here to avoid issues for faculty/admin
    },
    session_token: { type: String, default: null }
 }); 


// Ensure password is always hashed (even on update)
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    if (update && update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
        this.setUpdate(update);
    }
    next();
});

userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);
// This code defines a Mongoose schema for a User model, which includes fields for name, user_id, password, and role.
// It also includes pre-save middleware to hash the password before saving and a method to compare passwords.
// The role field is an enumerated type with three possible values: 'admin', 'faculty', and 'student', defaulting to 'student'.
// The model is exported for use in other parts of the application.
// The code uses bcryptjs for password hashing and comparison, ensuring secure storage of user passwords.
// The user_id field is unique, ensuring that no two users can have the same user_id.
// The schema is designed to be flexible, allowing for easy extension in the future if additional fields or functionality are needed.
// The use of async/await in the pre-save middleware and comparePassword method allows for cleaner and more readable asynchronous code.