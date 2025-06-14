const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
app.use(cors());

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Upload + Parse Route
app.post('/upload', upload.single('resume'), (req, res) => {
  if (!req.file) {
    console.error("❌ No file uploaded");
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const parserPath = path.join(__dirname, '../ml/parser.py'); // Make sure this path is correct
  const resumePath = req.file.path;

  console.log(`📄 Parsing file: ${resumePath}`);
  const command = `python "${parserPath}" "${resumePath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("🐍 Python Error:", stderr);
      return res.status(500).json({ error: 'Resume parsing failed', details: stderr });
    }

    try {
      const parsed = JSON.parse(stdout);
      res.json(parsed);
    } catch (e) {
      console.error("❌ JSON Parse Error:", e);
      res.status(500).json({ error: 'Invalid response from parser' });
    }
  });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
