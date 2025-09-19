const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();

// Buat folder uploads kalau belum ada
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== Gemini Config =====
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ===== Chat Session (ingat history otomatis) =====
const chat = model.startChat({
  history: [],
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
  },
  systemInstruction: {
    role: "user",
    parts: [
      {
        text: `
Kamu adalah Lnaxi Ai, asisten AI yang ramah, santai 😄
- Gunakan emoji dengan natural
- Gaya ngobrol hangat, kayak temen
- Jangan kaku
        `.trim(),
      },
    ],
  },
});

// ===== Multer Config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ===== Route Chat Teks =====
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong" });
    }

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const reply = response.text();

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Route Chat + Gambar =====
app.post("/api/chat-image", upload.single("image"), async (req, res) => {
  try {
    const userMessage = req.body.message || "Jelaskan gambar ini";

    let imagePart = null;
    if (req.file) {
      const imageBuffer = fs.readFileSync(req.file.path);
      const base64Image = imageBuffer.toString("base64");
      imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: req.file.mimetype,
        },
      };
    }

    const result = await chat.sendMessage([
      { text: userMessage },
      ...(imagePart ? [imagePart] : []),
    ]);

    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ===== Start Server =====
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
