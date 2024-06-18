const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const { generateContent } = require('./config/gemini')
const User = require('./src/models/User')
const Event = require('./src/models/Event')
const File = require('./src/models/File')
const express = require('express');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');
require('dotenv').config()
const { GoogleGenerativeAI } = require('@google/generative-ai');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


const app = express();

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);





let subjects = [];
// Function to fetch subjects and codes from database and populate subjectArray
async function fetchSubjectsFromDatabase() {
  try {
    const files = await File.find(); // Fetch all files from database
    subjects = files.map(file => ({
      subject: file.fileName,
      code: file.file_unique_id
    }));
    // console.log('subjects', subjects);

    console.log('Initialized subjectArray with data from database:');
  } catch (error) {
    console.error('Error fetching subjects from database:', error);
  }
}


// ---------------------
// Database connection 
// ------------------------

try {
  connectDB()
  fetchSubjectsFromDatabase()
  console.log('Db is connecting....');

} catch (e) {
  console.log("error in connecting DB", e)
  process.kill(process.pid, "SIGTERM")
}

// Middleware to generate greeting text based on user role
async function sendGreeting(ctx) {
  const userIsAdmin = await isAdmin(ctx);
  const userName = ctx.message.from.first_name || 'User';

  let greetingMessage;

  if (userIsAdmin) {
    greetingMessage = `
      🙏 Hello ${userName}! 🙏
  
      👉As an admin, you are allowed to upload files. Please keep the file caption(file name can be anything but caption should be in the given formate) in the format: *subjectName-year*.
      👉Exmple: "Heat transfer 2-2023" For now, you can only upload PYQ (Previous Year Questions) files.
  
      👉To upload a file, simply send it here with the correct caption.
      👉for any confusion contact *PRIYANSHU*
  
      Thank you!
      `;
  } else {
    greetingMessage = `
      🙏Hello ${userName}!🙏
  
      👉You can search for PYQ (Previous Year Questions) files here.
  
      👉Unfortunately, you do not have permission to upload files. If you need to upload something, please contact an admin.
  
      Thank you!
      `;
  }

  await ctx.reply(greetingMessage, { parse_mode: 'Markdown' });
}


// -----------------
// Bot Start 
// -----------------
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
  // const chatMember = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
  // return chatMember.status === 'administrator' || chatMember.status === 'creator';
  const from = ctx.update.message.from;


  let existingUser = false;

  try {
    existingUser = await User.findOne({ tgId: from.id });
    // console.log('existing user', existingUser);

    if (!existingUser?.isAdmin) {
      console.log('Reutrning false ---> uuse is not admin');

      return false;
    }

    else {
      return true;
    }

  }
  catch (err) {
    console.log('error in checking the user ', err);

  }
}




async function processFileName(name, id) {
  console.log('name: ', name);
  console.log('id: ', id);

  // Extract subject name from the file name
  const subject = name.split('-')[0].trim(); // Assuming subject name is before the first '-'

  // Generate code based on subject name and optional id
  const code = id;

  subjects.push({ subject, code })
  console.log('subjects: ', subjects);
  console.log('len', subjects.length);


  // Return an object with subject name 
  return subject;
}
async function findSubjectCode(query, subjects) {
  // Construct the prompt including subject names and codes
  const prompt = `Given the following subjects: ${subjects.map(entry => `${entry.subject} (${entry.code})`).join('; ')}
    Match the user's query "${query}" with the subjects (exact match is not necessary) and return the corresponding subject code. stricly return the code only and other special characters`;
  // const prompt = `Given the following subjects: ${subjects.map(entry => `${entry.subject} (${entry.code})`).join('; ')}
  //   Match the user's query "${query}" with the subjects (exact match is not necessary) and return the corresponding subject code.`;

  // console.log('prompt: ', prompt);

  try {
    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.log('text: ',text);
    const trimmedStr = text.trim();
    console.log('len',trimmedStr.length);
    if(trimmedStr.length){
      return trimmedStr
    }
    else ""
    

    // Extract the subject code from the response
    // const regex = /\*\*(\w+)\*\*/;
    // // Regular expression to match text between asterisks
    // // const regex = /\*\*(.*?)\*\*/;
    // // console.log('regex: ',regex);
    
    // const codeMatch = text.match(regex);
    // if (codeMatch && codeMatch[1]) {
    //   return codeMatch[1];
    // } else {
    //   return null;
    // }
  } catch (error) {
    console.error('Error generating content:', error);
    return null;
  }
}


async function handleQuery(ctx) {
 
  
  const userQuery = ctx.message.text;

  // const sentMessage = await ctx.replyWithSticker("'CAACAgIAAxkBAAICPWZrZftcp3KqHB3e1pgoZ7w9UCzCAAJGAANSiZEj-P7l5ArVCh01BA'"); // Send the message
  
  //sending the loading sticker
  const {message_id:waitingMessageId}= await ctx.reply("Loading....")
  const {message_id:waitingStickerId}= await ctx.replyWithSticker('CAACAgIAAxkBAAICbGZrbvaXS9Yu_Sc09R6uZpI-VP7jAAI-AANSiZEjjHxD4k8_C241BA')


  try {
    // Call function to find subject code based on user query
    const subjectCode = await findSubjectCode(userQuery, subjects);
    if (subjectCode) {

      try {
        // Find subject based on subject name
        const file = await File.findOne({ file_unique_id: { $regex: new RegExp(subjectCode, 'i') } });
      
        if (!file) {
          await ctx.deleteMessage(waitingStickerId)
          await ctx.deleteMessage(waitingStickerId)
          ctx.reply(`🧐 No files found for subject.`);
        } else {
          await ctx.deleteMessage(waitingMessageId)
          await ctx.deleteMessage(waitingStickerId)
          // Send document to the user
          await ctx.telegram.sendDocument(ctx.chat.id, file.fileLink, { caption: `PYQ for **${file.fileName}**. 😉 Uploaded by: ${file.uploadedBy}` });
        }
      } catch (error) {

        console.error(' Error querying database:', error);
        ctx.reply('🧐 Error querying database. Please try again later.');
      }
    }
  } catch (error) {
    // await ctx.deleteMessage(messageId);
    await ctx.deleteMessage(messageId2);
    console.error('Error:', error);
    await ctx.reply('Sorry, I had trouble understanding your request. Please try again.');
  }
}


// Handle incoming messages
bot.on('message', async (ctx) => {

  // console.log('ctx', ctx);


  const chatId = ctx.message.chat.id;
  const uploadedBy = ctx.update.message.from.id;

  if (ctx.message.document && ctx.message.document.mime_type === 'application/pdf') {
    console.log('got the pdf file for upload');

    const fileId = ctx.message.document.file_id;


    const file_unique_id = ctx.message.document.file_unique_id;

    // const fileName = ctx.message.document.file_name;


    if (!ctx.message.caption) {
      ctx.reply("Please provide a caption for filename")
      return;
    }

    const fileName = await processFileName(ctx.message.caption, ctx.message.document.file_unique_id);
    console.log('fileName:---> ' + fileName);


    // Check if the user is an admin
    const userIsAdmin = await isAdmin(ctx);
    console.log('checking if user is admin');

    if (userIsAdmin) {
      console.log('yes user is admin');

      // Save file information to MongoDB
      const newFile = new File({
        file_unique_id,// for searching in db
        fileName, // normal file name passed in caption
        fileLink: fileId, // downloadable file link
        uploadedBy
      });

      try {
        await newFile.save();
        console.log('File information saved to MongoDB.');

        // Send acknowledgment to the user
        ctx.reply('🫡 Thank you!! for uploading the PDF document. 🫡');

      } catch (error) {
        console.error('Error saving file information:', error);
        ctx.reply('There was an error saving the PDF document.');
      }
    } else {
      ctx.reply('You are not permitted to upload PDF documents.');
    }
  } else {
    // Handle messages that do not contain PDF documents


    handleQuery(ctx)



  }
});












bot.on('text', async (ctx) => {

});







// ---------
// Lauch 
// ---------


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));





// bot.on(message('sticker'), (ctx) => ctx.reply('👍'));



//Important points
//: commands ko upar rkhna hai and text ko nichay
//bucz commands are text as well


// TODO:
// failed to save pdf -"CAACAgIAAxkBAAIBFmZpbdTk8FEnQLgOODiYyZr3730KAAI5DwACdrIpSvr8TNGlMJ1aNQQ"

// tanks for uploading - "CAACAgIAAxkBAAIBE2ZpbdCTnZY2yKy-DgTTOtM985PNAAJAAQACVp29CmzpW0AsSdYlNQQ"