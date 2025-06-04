// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import dotenv from "dotenv";
// dotenv.config();

// const llm = new ChatGoogleGenerativeAI({
//   // model: "gemini-1.5-pro",
//   model: "gemini-1.5-flash",

//   apiKey: process.env.GOOGLE_API_KEY,
//   temperature: 0,
//   maxRetries: 2,
// });

// const aiMsg = await llm.invoke([
//   new SystemMessage(
//     "You are a helpful assistant that answer the user question ."
//   ),
//   new HumanMessage("What is LangChain?"),
// ]);

// console.log(aiMsg.content);

import dotenv from "dotenv";
dotenv.config();

import readline from "readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

// Initialize readline to accept input from terminal
const rl = readline.createInterface({ input, output });

// Ask user for input
const userInput = await rl.question(
  "Enter your English sentence to translate to French: "
);
rl.close();

// Initialize Gemini chat model
const chat = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash", // Use "gemini-1.5-pro" if you prefer
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

// Define prompt with dynamic placeholder
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that translates English to urdu."],
  ["human", "{input}"],
]);

// Fill the prompt template with actual user input
const formattedMessages = await prompt.formatMessages({
  input: userInput,
});

// Invoke Gemini with the prompt
const response = await chat.invoke(formattedMessages);

console.log("\nFrench Translation:", response.content);
