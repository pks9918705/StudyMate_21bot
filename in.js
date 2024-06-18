const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('./src/models/User');
const Event = require('./src/models/Event');
const File = require('./src/models/File');
const express = require('express');
const connectDB = require('./config/db');
const { generateContent } = require('./config/gemini');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const app = express();

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);

// Database connection
try {
    connectDB();
    console.log('Db is connecting....');
} catch (e) {
    console.log("error in connecting DB", e);
    process.kill(process.pid, "SIGTERM");
}

// Middleware to generate greeting text based on user role
async function sendGreeting(ctx) {
    const userIsAdmin = await isAdmin(ctx);
    const userName = ctx.message.from.first_name || 'User';

    let greetingMessage;

    if (userIsAdmin) {
        greetingMessage = `
🙏 Hello ${userName}! 🙏

👉 As an admin, you are allowed to upload files. Please keep the file caption (file name can be anything but caption should be in the given format) in the format: *subjectName-year*.
👉 Example: "Heat transfer 2-2023" For now, you can only upload PYQ (Previous Year Questions) files.

👉 To upload a file, simply send it here with the correct caption.
👉 For any confusion contact *PRIYANSHU*

Thank you!
`;
    } else {
        greetingMessage = `
🙏 Hello ${userName}! 🙏

👉 You can search for PYQ (Previous Year Questions) files here.

👉 Unfortunately, you do not have permission to upload files. If you need to upload something, please contact an admin.

Thank you!
`;
    }

    await ctx.reply(greetingMessage, { parse_mode: 'Markdown' });
}

// Bot Start
bot.start(async (ctx) => {
    const from = ctx.update.message.from;

    try {
        let existingUser = await User.findOne({ tgId: from.id });

        if (!existingUser) {
            const newUser = new User({
                tgId: from.id,
                firstName: from.first_name,
                lastName: from.last_name,
                isBot: from.is_bot,
                username: from.username || `user_${from.id}`
            });
            existingUser = await newUser.save();
        } else {
            existingUser.firstName = from.first_name;
            existingUser.lastName = from.last_name;
            existingUser.isBot = from.is_bot;
            existingUser.username = from.username || existingUser.username;
            await existingUser.save();
        }

        // Call sendGreeting to generate and send the appropriate greeting
        console.log('sending the greeting');
        await sendGreeting(ctx);
    } catch (err) {
        console.error('Error in start handler:', err);
        await ctx.reply('Facing difficulties');
    }
});

// Middleware to check if the user is an admin
async function isAdmin(ctx) {
    const from = ctx.update.message.from;
    let existingUser = false;

    try {
        existingUser = await User.findOne({ tgId: from.id });
        console.log('existing user', existingUser);

        if (!existingUser?.isAdmin) {
            console.log('Returning false ---> User is not admin');
            return false;
        } else {
            return true;
        }
    } catch (err) {
        console.log('Error in checking the user ', err);
    }
}






// Initialize an empty array to store subjects and codes
let subject_arr = [];



// Handle incoming messages
bot.on('message', async (ctx) => {

    console.log('ctx', ctx.update.message);
    
      
});


// Launch bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));



// admin jo caption mein bhejayga vo file name hoga
// code jo ki array mein store krna hai vo file_id ho jo telegram deta hai
// subject_array mein subject ka naame and uska file_id 