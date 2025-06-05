// 📁 backend/server.js
import express from "express";
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse";
import dotenv from "dotenv";

const { fromPath } = await import("pdf2pic");

import Tesseract from "tesseract.js";
// import { ChatGoogleGenerativeAI } from "@langchain/google";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: "uploads/" });
let retriever = null;

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    let text = "";

    try {
      const parsed = await pdf(fileBuffer);
      text = parsed.text.trim();
      if (!text || text.length < 50) throw new Error("Not enough text");
    } catch {
      console.log("No readable text found. Attempting OCR...");
      const convert = fromPath(filePath, {
        density: 200,
        saveFilename: "ocr_temp",
        savePath: "./uploads/ocr_images",
        format: "png",
        width: 1200,
        height: 1600,
      });

      const imageDir = "./uploads/ocr_images";
      if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);
      await convert(1); // convert page 1 for OCR

      const imageFiles = fs
        .readdirSync(imageDir)
        .filter((f) => f.endsWith(".png"));

      for (const img of imageFiles) {
        const result = await Tesseract.recognize(`${imageDir}/${img}`, "eng", {
          logger: (m) => console.log(m),
        });
        text += result.data.text + "\n";
      }
    }

    if (!text) {
      return res
        .status(400)
        .json({ error: "Failed to extract text from file." });
    }

    const docs = [{ pageContent: text, metadata: { source: filePath } }];
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    const vectorStore = await MemoryVectorStore.fromDocuments(
      splitDocs,
      new OpenAIEmbeddings()
    );

    retriever = vectorStore.asRetriever();
    res.json({ message: "File uploaded and processed successfully." });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "File upload failed." });
  }
});

app.post("/api/ask", async (req, res) => {
  if (!retriever)
    return res.status(400).json({ error: "No document uploaded yet." });

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
      (data) => data.prompt,
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
