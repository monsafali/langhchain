import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const chat = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that translates English to Urdu."],
  ["human", "{input}"],
]);

app.post("/api/translate", async (req, res) => {
  try {
    const { text } = req.body;
    const formattedMessages = await prompt.formatMessages({ input: text });
    const response = await chat.invoke(formattedMessages);
    res.json({ translation: response.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
