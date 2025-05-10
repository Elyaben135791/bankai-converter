const express = require("express");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");
const cors = require("cors");
const dotenv = require("dotenv");
const Tesseract = require("tesseract.js");
const pdfParse = require("pdf-parse");
const path = require("path");
const { generatePrompt } = require("./prompt");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
app.use(cors());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract text from TXT, PDF, or Image
async function extractText(filePath, mimetype) {
  if (mimetype.startsWith("image/")) {
    const result = await Tesseract.recognize(filePath, "eng");
    return result.data.text;
  } else if (mimetype === "application/pdf") {
    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } else {
    return fs.readFileSync(filePath, "utf-8");
  }
}

// Handle upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { path: filePath, mimetype } = req.file;
    const text = await extractText(filePath, mimetype);
    const prompt = generatePrompt(text);

    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const csv = gptResponse.choices[0].message.content;
    fs.unlinkSync(filePath); // Delete the uploaded file after processing
    res.send(csv);
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).send("Something went wrong.");
  }
});

// Serve frontend.html at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});

