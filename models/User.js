// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    usertype: {
        type: String,
        enum: ["user", "admin"],  // restrict to only these two
        default: "user"           // default role is normal user
    }
});

module.exports = mongoose.model('User', userSchema);
