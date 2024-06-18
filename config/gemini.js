// ----------
// Gen AI api 
// ----------
const { GoogleGenerativeAI }=require("@google/generative-ai")
require('dotenv').config()
// 1. Configuration
const api_key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(api_key);

const generationConfig = { 
  temperature: 0.9, 
  topP: 1, 
  topK: 1, 
  maxOutputTokens: 4096 
};

// 2. Initialise Model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });

// ----------------
// Gemini Vision
// ----------------

// 3. Generate Content
async function generateContent() {
  try {
    const prompt = "Create a Meal plan for today. It should be formatted in such a way that in Telegram the ** words are automatically highlighted.";
    const result = await model.generateContent(prompt);
    const response = result.response;
    console.log(response.text()) 
  } catch (error) {
    console.error('Error generating content:', error);
  }
}

// Export the function
module.exports = { generateContent };
