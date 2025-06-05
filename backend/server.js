// Document UPloaded

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// __dirname fix for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LangChain & Gemini
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Setup
dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

// Multer config to handle file uploads
const upload = multer({ dest: "uploads/" });

// In-memory vector retriever (reset on server restart)
let retriever = null;

// Route: Upload PDF and Index
app.post("/api/upload", upload.single("file"), async (req, res) => {
  console.log("Uploaded file:", req.file);
  const filePath = path.join(__dirname, req.file.path);

  try {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await splitter.splitDocuments(docs);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      embeddings
    );

    retriever = vectorStore.asRetriever();

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({ message: "Document uploaded and indexed successfully!" });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Failed to process document" });
  }
});

// Route: Ask Question
app.post("/api/ask", async (req, res) => {
  if (!retriever) {
    return res.status(400).json({ error: "No document uploaded yet." });
  }

  const { question } = req.body;

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });

    const chain = RunnableSequence.from([
      async (input) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return {
          prompt: `Context:\n${docs
            .map((d) => d.pageContent)
            .join("\n\n")}\n\nQuestion: ${input.question}`,
        };
      },
      (data) => data.prompt, // Just return the prompt string
      model,
      new StringOutputParser(),
    ]);

    const answer = await chain.invoke({ question });
    res.json({ answer });
  } catch (err) {
    console.error("Ask Error:", err);
    res.status(500).json({ error: "Failed to generate answer." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
