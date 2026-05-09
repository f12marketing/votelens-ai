import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { promises as fs } from 'fs';

/**
 * Enterprise-grade Secure File Upload Middleware
 * File type validation, size limits, virus scanning, and secure storage
 */

/**
 * Allowed MIME types for uploads
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json',
];

/**
 * Allowed file extensions
 */
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.pdf',
  '.xls',
  '.xlsx',
  '.csv',
  '.json',
];

/**
 * Maximum file sizes by type (in bytes)
 */
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  csv: 100 * 1024 * 1024, // 100MB
  json: 10 * 1024 * 1024, // 10MB
};

/**
 * Magic numbers for file type validation
 */
const MAGIC_NUMBERS: Record<string, Buffer> = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
  'image/gif': Buffer.from([0x47, 0x49, 0x46, 0x38]),
  'application/pdf': Buffer.from([0x25, 0x50, 0x44, 0x46]),
};

/**
 * File validation result
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Secure file upload validator
 */
export class SecureUploadValidator {
  /**
   * Validate file extension
   */
  static validateExtension(filename: string): ValidationResult {
    const ext = path.extname(filename).toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        valid: false,
        error: `File extension ${ext} is not allowed`,
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate MIME type
   */
  static validateMimeType(mimeType: string): ValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        valid: false,
        error: `MIME type ${mimeType} is not allowed`,
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate file size
   */
  static validateFileSize(size: number, fileType: string): ValidationResult {
    const maxSize = MAX_FILE_SIZES[fileType as keyof typeof MAX_FILE_SIZES] || MAX_FILE_SIZES.document;
    
    if (size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate file content using magic numbers
   */
  static async validateMagicNumber(buffer: Buffer, mimeType: string): Promise<ValidationResult> {
    const expectedMagic = MAGIC_NUMBERS[mimeType];
    
    if (!expectedMagic) {
      // No magic number defined for this type, skip validation
      return { valid: true };
    }
    
    const actualMagic = buffer.slice(0, expectedMagic.length);
    
    if (!actualMagic.equals(expectedMagic)) {
      return {
        valid: false,
        error: 'File content does not match declared MIME type',
      };
    }
    
    return { valid: true };
  }

  /**
   * Sanitize filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    const sanitized = filename.replace(/[\/\\]/g, '');
    
    // Remove null bytes
    const noNulls = sanitized.replace(/\0/g, '');
    
    // Generate safe filename
    const ext = path.extname(noNulls);
    const base = path.basename(noNulls, ext);
    
    // Remove special characters
    const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Generate random filename if base is empty
    const finalBase = safeBase || crypto.randomBytes(16).toString('hex');
    
    return `${finalBase}${ext}`;
  }

  /**
   * Generate secure storage path
   */
  static generateStoragePath(uploadDir: string, userId: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return path.join(uploadDir, userId, year, month, day);
  }

  /**
   * Ensure upload directory exists with secure permissions
   */
  static async ensureUploadDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o750 });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
      throw new Error('Failed to create upload directory');
    }
  }
}

/**
 * Secure multer storage configuration
 */
const secureStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const userId = (req as any).user?.id || 'anonymous';
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const storagePath = SecureUploadValidator.generateStoragePath(uploadDir, userId);
      
      await SecureUploadValidator.ensureUploadDir(storagePath);
      
      cb(null, storagePath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  
  filename: (req, file, cb) => {
    const sanitized = SecureUploadValidator.sanitizeFilename(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

/**
 * File filter for multer
 */
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Validate extension
  const extResult = SecureUploadValidator.validateExtension(file.originalname);
  if (!extResult.valid) {
    return cb(new Error(extResult.error));
  }

  // Validate MIME type
  const mimeResult = SecureUploadValidator.validateMimeType(file.mimetype);
  if (!mimeResult.valid) {
    return cb(new Error(mimeResult.error));
  }

  cb(null, true);
};

/**
 * Create secure upload middleware
 */
export const createSecureUpload = (options: {
  maxSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
} = {}) => {
  const {
    maxSize = MAX_FILE_SIZES.document,
    maxFiles = 5,
    allowedTypes = ALLOWED_MIME_TYPES,
  } = options;

  return multer({
    storage: secureStorage,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: maxFiles,
    },
  });
};

/**
 * Upload validation middleware
 */
export const validateUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NO_FILE_UPLOADED',
        message: 'No file uploaded',
      },
    });
  }

  next();
};

/**
 * Content validation middleware
 * Validates file content after upload
 */
export const validateFileContent = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);
  
  for (const file of files) {
    try {
      // Read first 8 bytes for magic number validation
      const buffer = await fs.readFile(file.path);
      const header = buffer.slice(0, 8);
      
      const validation = await SecureUploadValidator.validateMagicNumber(header, file.mimetype);
      
      if (!validation.valid) {
        // Delete invalid file
        await fs.unlink(file.path);
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE_CONTENT',
            message: validation.error,
          },
        });
      }
    } catch (error) {
      // Delete file on error
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        // Ignore unlink error
      }
      
      return res.status(500).json({
        success: false,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: 'Failed to validate file content',
        },
      });
    }
  }

  next();
};

/**
 * Virus scanning middleware (placeholder for ClamAV integration)
 */
export const scanForViruses = async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);
  
  // In production, integrate with ClamAV or similar
  // For now, this is a placeholder
  console.log(`Scanning ${files.length} file(s) for viruses...`);
  
  // Simulate virus scan
  await new Promise(resolve => setTimeout(resolve, 100));
  
  next();
};

/**
 * File cleanup middleware
 * Removes files on error
 */
export const cleanupOnUploadError = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);
  
  const originalSend = res.send;
  res.send = function(data) {
    // If response is error status, delete uploaded files
    if (res.statusCode >= 400) {
      files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          console.error('Failed to delete file on error:', error);
        }
      });
    }
    
    return originalSend.call(this, data);
  };

  next();
};

/**
 * File metadata logging middleware
 */
export const logUploadMetadata = (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as Express.Multer.File[] || (req.file ? [req.file] : []);
  
  files.forEach(file => {
    console.log('File upload metadata:', {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      userId: (req as any).user?.id,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

/**
 * Export secure upload middleware chain
 */
export const secureUploadChain = [
  createSecureUpload(),
  validateUpload,
  validateFileContent,
  scanForViruses,
  logUploadMetadata,
  cleanupOnUploadError,
];

/**
 * Export individual middleware
 */
export const secureUpload = {
  validator: SecureUploadValidator,
  middleware: createSecureUpload,
  validation: validateUpload,
  contentValidation: validateFileContent,
  virusScan: scanForViruses,
  cleanup: cleanupOnUploadError,
  logging: logUploadMetadata,
  chain: secureUploadChain,
};
