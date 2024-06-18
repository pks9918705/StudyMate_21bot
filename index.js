require('dotenv').config();

const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_API);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const subjectArray = [
  { subject: "heat transfer 2", code: "ht202405" },
  { subject: "fluid mechanics", code: "fm202403" },
  { subject: "process equipment", code: "pd202403" }
];

async function findSubjectCode(query, subjectArray) {
  // Construct the prompt including subject names and codes
  const prompt = `Given the following subjects: ${subjectArray.map(entry => `${entry.subject} (${entry.code})`).join('; ')}
    Match the user's query "${query}" with the subjects (exact match is not necessary) and return the corresponding subject code.`;
  
  console.log('prompt: ', prompt);
   
  try {
    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
      console.log('text: ', text);
      
    // Extract the subject code from the response
    const regex = /\*\*(\w+)\*\*/;
    const codeMatch = text.match(regex);
    if (codeMatch && codeMatch[1]) {
      return codeMatch[1];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error generating content:', error);
    return null;
  }
}



bot.on('text', async (ctx) => {
  const userQuery = ctx.message.text;

  try {
    // Call function to find subject code based on user query
    const subjectCode = await findSubjectCode(userQuery, subjectArray);
    if (subjectCode) {
      await ctx.reply(`The Subject code is ${subjectCode}`);
    } else {
      await ctx.reply(`Sorry, I couldn't find matching subject code for "${userQuery}"`);
    }
  } catch (error) {
    console.error('Error:', error);
    await ctx.reply('Sorry, I had trouble understanding your request. Please try again.');
  }
});

bot.launch();
