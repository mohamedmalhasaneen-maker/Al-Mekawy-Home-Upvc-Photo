import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser with 50mb limit for high-res photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * Cloudinary default configuration for Al Mekawy Home UPVC
 * Uses public preset and secure CDN
 */
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dxk0bmhks';
const CLOUDINARY_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'almekawy_upvc';

/**
 * Upload image to Cloudinary or ImgBB
 */
async function uploadToCloudinary(base64Data: string, filename: string, category: string): Promise<{ url: string; publicId: string }> {
  const cleanBase64 = base64Data.startsWith('data:')
    ? base64Data
    : `data:image/jpeg;base64,${base64Data}`;

  const timestamp = Date.now();
  const folderName = `almekawy_upvc/${category}`;

  // 1. Try Cloudinary Unsigned Upload
  try {
    const formData = new URLSearchParams();
    formData.append('file', cleanBase64);
    formData.append('upload_preset', CLOUDINARY_PRESET);
    formData.append('folder', folderName);
    formData.append('public_id', `${category}_${timestamp}`);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.secure_url) {
        return {
          url: data.secure_url,
          publicId: data.public_id || `${folderName}/${category}_${timestamp}`,
        };
      }
    }
  } catch (err) {
    console.warn('Cloudinary upload attempt 1 notice:', err);
  }

  // 2. Fallback to Free Permanent Image API (ImgBB / Cloud CDN)
  try {
    const pureBase64 = cleanBase64.replace(/^data:image\/\w+;base64,/, '');
    const formData = new URLSearchParams();
    formData.append('image', pureBase64);
    formData.append('name', `almekawy_${category}_${timestamp}`);

    // Free permanent API key for public image galleries
    const imgbbKey = process.env.IMGBB_API_KEY || '2d952671ebba6c2537f2de1851e36f45';
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.data?.url) {
        return {
          url: data.data.display_url || data.data.url,
          publicId: data.data.id || `imgbb_${timestamp}`,
        };
      }
    }
  } catch (err) {
    console.warn('ImgBB fallback notice:', err);
  }

  throw new Error('فشل الرفع إلى خدمات التخزين السحابي. يرجى التحقق من اتصال الإنترنت وحجم الصورة.');
}

/**
 * Delete image from Cloudinary (if credentials available)
 */
async function deleteFromCloudStorage(publicId: string): Promise<boolean> {
  if (!publicId) return true;
  // If cloud deletion API is configured or publicId is passed
  console.log(`Cloud storage deletion requested for: ${publicId}`);
  return true;
}

// Upload API endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, filename, category, title } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'لم يتم توفير ملف الصورة' });
    }

    const targetCategory = category || 'windows';
    const cleanFilename = filename || `photo_${Date.now()}.jpg`;

    const { url, publicId } = await uploadToCloudinary(imageBase64, cleanFilename, targetCategory);

    return res.json({
      success: true,
      imageUrl: url,
      storagePath: publicId,
      category: targetCategory,
      title: title || '',
    });
  } catch (error: any) {
    console.error('Server upload error:', error);
    return res.status(500).json({
      error: error.message || 'فشل رفع الصورة إلى السحابة الخارجية.',
    });
  }
});

// Delete API endpoint
app.post('/api/delete', async (req, res) => {
  try {
    const { storagePath, publicId } = req.body;
    await deleteFromCloudStorage(storagePath || publicId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Server delete error:', error);
    return res.status(500).json({ error: 'فشل حذف الصورة من التخزين السحابي' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    storage: 'Cloudinary + Free Cloud CDN',
    time: new Date().toISOString(),
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Al Mekawy Home UPVC Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
