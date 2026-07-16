import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const GALLERY_FILE = path.join(process.cwd(), 'gallery_photos.json');
const CATALOG_FILE = path.join(process.cwd(), 'catalog_data.json');

// Helper to read JSON safely
function readJsonFile(filePath: string, fallback: any) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return fallback;
}

// Helper to write JSON safely
function writeJsonFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
    return false;
  }
}

// API Routes
app.get("/api/gallery", (req, res) => {
  const data = readJsonFile(GALLERY_FILE, null);
  res.json({ success: true, data });
});

app.post("/api/gallery", (req, res) => {
  const { photos } = req.body;
  if (!photos) {
    return res.status(400).json({ success: false, message: "Missing photos" });
  }
  const success = writeJsonFile(GALLERY_FILE, photos);
  res.json({ success });
});

app.get("/api/catalog", (req, res) => {
  const data = readJsonFile(CATALOG_FILE, null);
  res.json({ success: true, data });
});

app.post("/api/catalog", (req, res) => {
  const { catalog } = req.body;
  if (!catalog) {
    return res.status(400).json({ success: false, message: "Missing catalog" });
  }
  const success = writeJsonFile(CATALOG_FILE, catalog);
  res.json({ success });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
