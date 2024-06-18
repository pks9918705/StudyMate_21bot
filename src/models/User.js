const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    tgId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    isBot: {
        type: Boolean,
        required: true
    },
    isAdmin:{
        type: Boolean,
        default: false,
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    promptToken: {
        type: Number,
        // Only required when generating, not during post
        required: false
    },
    completionTokens: {
        type: Number,
        required: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
