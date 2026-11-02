import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../middlewares/auth';
import { AppError, sendSuccess } from '../utils/response';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { env } from '../config/env';

const router = Router();

// Ensure upload directory exists for local disk fallback
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

// Multer memory storage so we can send to Cloudinary or write to local disk
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only image files (JPEG, PNG, WEBP, GIF) are allowed'));
    }
  },
});

router.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError(400, 'NO_FILE_UPLOADED', 'Please select an image file to upload (field name: "file")');
      }

      // If Cloudinary credentials are provided, upload to Cloudinary
      if (isCloudinaryConfigured) {
        const uploadPromise = new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'campusloop',
              resource_type: 'image',
            },
            (error, result) => {
              if (error || !result) {
                return reject(new AppError(500, 'CLOUDINARY_UPLOAD_FAILED', error?.message || 'Upload to Cloudinary failed'));
              }
              resolve(result.secure_url);
            }
          );
          uploadStream.end(req.file!.buffer);
        });

        const url = await uploadPromise;
        sendSuccess(res, { url }, 201);
        return;
      }

      // Fallback: Local disk storage in dev
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
      const filePath = path.join(env.UPLOAD_DIR, filename);

      await fs.promises.writeFile(filePath, req.file.buffer);

      const host = req.get('host') || `localhost:${env.PORT}`;
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${filename}`;

      sendSuccess(res, { url: fileUrl }, 201);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

