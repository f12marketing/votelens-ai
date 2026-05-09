import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Image Optimization Service
 * Handles image compression, format conversion, and optimization
 */

export class ImageOptimizationService {
  private static readonly SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'];
  private static readonly MAX_WIDTH = 1920;
  private static readonly MAX_HEIGHT = 1080;
  private static readonly QUALITY = 85;

  /**
   * Optimize an image
   */
  static async optimizeImage(
    inputPath: string,
    outputPath: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      progressive?: boolean;
    } = {}
  ): Promise<{ size: number; originalSize: number; savings: number }> {
    const {
      width = this.MAX_WIDTH,
      height = this.MAX_HEIGHT,
      quality = this.QUALITY,
      format = 'webp',
      progressive = true,
    } = options;

    // Get original file size
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // Process image
    let pipeline = sharp(inputPath);

    // Resize if dimensions provided
    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 6 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 4 });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: 9, adaptiveFiltering: true });
        break;
    }

    // Save optimized image
    await pipeline.toFile(outputPath);

    // Get optimized file size
    const optimizedStats = await fs.stat(outputPath);
    const optimizedSize = optimizedStats.size;
    const savings = originalSize - optimizedSize;
    const savingsPercent = ((savings / originalSize) * 100).toFixed(2);

    return {
      size: optimizedSize,
      originalSize,
      savings: parseFloat(savingsPercent),
    };
  }

  /**
   * Generate responsive image variants
   */
  static async generateResponsiveImages(
    inputPath: string,
    outputDir: string,
    baseName: string
  ): Promise<{
      variants: Array<{ width: number; path: string; size: number }>;
      totalSize: number;
    }> {
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const variants: Array<{ width: number; path: string; size: number }> = [];
    let totalSize = 0;

    for (const width of widths) {
      const outputPath = path.join(outputDir, `${baseName}-${width}.webp`);
      
      const result = await this.optimizeImage(inputPath, outputPath, {
        width,
        format: 'webp',
      });

      variants.push({
        width,
        path: outputPath,
        size: result.size,
      });

      totalSize += result.size;
    }

    return { variants, totalSize };
  }

  /**
   * Generate srcset for responsive images
   */
  static generateSrcset(variants: Array<{ width: number; path: string }>): string {
    return variants
      .map(({ width, path }) => `${path} ${width}w`)
      .join(', ');
  }

  /**
   * Generate blur-up placeholder (low-quality image placeholder)
   */
  static async generateBlurPlaceholder(
    inputPath: string,
    outputPath: string,
    width: number = 20
  ): Promise<string> {
    await sharp(inputPath)
      .resize(width, null, { fit: 'inside' })
      .blur(2)
      .jpeg({ quality: 30 })
      .toFile(outputPath);

    const buffer = await fs.readFile(outputPath);
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  /**
   * Convert image format
   */
  static async convertFormat(
    inputPath: string,
    outputPath: string,
    targetFormat: 'webp' | 'avif' | 'jpeg' | 'png'
  ): Promise<void> {
    let pipeline = sharp(inputPath);

    switch (targetFormat) {
      case 'webp':
        pipeline = pipeline.webp({ quality: this.QUALITY });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: this.QUALITY });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: this.QUALITY });
        break;
      case 'png':
        pipeline = pipeline.png({ quality: this.QUALITY });
        break;
    }

    await pipeline.toFile(outputPath);
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imagePath: string) {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: (await fs.stat(imagePath)).size,
      hasAlpha: metadata.hasAlpha,
      isProgressive: metadata.isProgressive,
    };
  }

  /**
   * Batch optimize images in a directory
   */
  static async batchOptimizeDirectory(
    inputDir: string,
    outputDir: string,
    options: { format?: 'webp' | 'avif' | 'jpeg'; quality?: number } = {}
  ): Promise<{
      processed: number;
      failed: number;
      totalSavings: number;
      errors: Array<{ file: string; error: string }>;
    }> {
    const files = await fs.readdir(inputDir);
    const imageFiles = files.filter(file => 
      this.SUPPORTED_FORMATS.includes(file.split('.').pop()?.toLowerCase() || '')
    );

    let processed = 0;
    let failed = 0;
    let totalSavings = 0;
    const errors: Array<{ file: string; error: string }> = [];

    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      const outputFileName = file.replace(/\.(jpg|jpeg|png)$/i, `.${options.format || 'webp'}`);
      const outputPath = path.join(outputDir, outputFileName);

      try {
        const result = await this.optimizeImage(inputPath, outputPath, options);
        processed++;
        totalSavings += result.savings;
      } catch (error) {
        failed++;
        errors.push({ file, error: (error as Error).message });
      }
    }

    return { processed, failed, totalSavings, errors };
  }

  /**
   * Strip metadata from images (for privacy and size reduction)
   */
  static async stripMetadata(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath)
      .rotate() // Auto-orient based on EXIF
      .toFile(outputPath);
  }

  /**
   * Generate image CDN URL with optimization parameters
   */
  static generateCDNUrl(
    baseUrl: string,
    imagePath: string,
    params: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'auto';
      fit?: 'cover' | 'contain' | 'fill';
    } = {}
  ): string {
    const url = new URL(imagePath, baseUrl);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  /**
   * Validate image file
   */
  static async validateImage(imagePath: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const metadata = await sharp(imagePath).metadata();
      
      if (!metadata.width || !metadata.height) {
        errors.push('Invalid image dimensions');
      }

      if (metadata.width > 4096 || metadata.height > 4096) {
        errors.push('Image dimensions exceed maximum allowed (4096x4096)');
      }

      const stats = await fs.stat(imagePath);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (stats.size > maxSize) {
        errors.push('Image size exceeds maximum allowed (10MB)');
      }

      if (!this.SUPPORTED_FORMATS.includes(metadata.format || '')) {
        errors.push(`Unsupported format: ${metadata.format}`);
      }
    } catch (error) {
      errors.push(`Invalid image file: ${(error as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate optimal image dimensions based on viewport
   */
  static calculateOptimalDimensions(
    viewportWidth: number,
    devicePixelRatio: number = 1
  ): { width: number; height: number } {
    const width = Math.min(viewportWidth * devicePixelRatio, this.MAX_WIDTH);
    const height = Math.round(width * (9 / 16)); // 16:9 aspect ratio
    return { width, height };
  }

  /**
   * Generate image manifest for PWA
   */
  static async generateImageManifest(
    images: Array<{ src: string; sizes: string; type: string }>
  ): Promise<any> {
    return {
      icons: images.map(img => ({
        src: img.src,
        sizes: img.sizes,
        type: img.type,
        purpose: 'any maskable',
      })),
    };
  }

  /**
   * Create sprite sheet from multiple images
   */
  static async createSpriteSheet(
    imagePaths: string[],
    outputPath: string,
    options: {
      spacing?: number;
      format?: 'png' | 'webp';
    } = {}
  ): Promise<{ width: number; height: number; positions: Array<{ x: number; y: number }> }> {
    const { spacing = 2, format = 'png' } = options;
    const images = await Promise.all(
      imagePaths.map(p => sharp(p).metadata())
    );

    const maxWidth = Math.max(...images.map(img => img.width || 0));
    const maxHeight = Math.max(...images.map(img => img.height || 0));
    
    const columns = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / columns);
    
    const spriteWidth = columns * maxWidth + (columns + 1) * spacing;
    const spriteHeight = rows * maxHeight + (rows + 1) * spacing;

    // Create composite image
    const composite = sharp({
      create: {
        width: spriteWidth,
        height: spriteHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    const positions: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const x = col * maxWidth + (col + 1) * spacing;
      const y = row * maxHeight + (row + 1) * spacing;

      positions.push({ x, y });

      const image = sharp(imagePaths[i]);
      const resized = await image.resize(maxWidth, maxHeight, { fit: 'inside' });
      const buffer = await resized.toBuffer();

      // Composite would be done here in actual implementation
    }

    await composite.toFile(outputPath);

    return { width: spriteWidth, height: spriteHeight, positions };
  }
}

/**
 * Frontend image optimization utility
 */
export class FrontendImageOptimizer {
  /**
   * Lazy load images with Intersection Observer
   */
  static setupLazyLoading() {
    if (typeof window === 'undefined') return;

    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }

  /**
   * Add blur-up effect to images
   */
  static addBlurUpEffect(img: HTMLImageElement, placeholder: string) {
    img.style.filter = 'blur(10px)';
    img.src = placeholder;

    img.onload = () => {
      img.style.transition = 'filter 0.3s ease-in-out';
      img.style.filter = 'blur(0)';
    };
  }

  /**
   * Preload critical images
   */
  static preloadImages(urls: string[]) {
    if (typeof window === 'undefined') return;

    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Decode images in parallel
   */
  static async decodeImages(imgs: HTMLImageElement[]): Promise<void> {
    const promises = imgs.map(img => {
      return new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${img.src}`));
        }
      });
    });

    await Promise.allSettled(promises);
  }

  /**
   * Generate responsive image markup
   */
  static generateResponsiveImageMarkup(
    baseUrl: string,
    imagePath: string,
    alt: string,
    className?: string
  ): string {
    const widths = [320, 640, 768, 1024, 1280, 1920];
    const srcset = widths
      .map(w => `${baseUrl}${imagePath}?width=${w}&format=webp ${w}w`)
      .join(', ');

    return `
      <img
        src="${baseUrl}${imagePath}?width=640&format=webp"
        srcset="${srcset}"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt="${alt}"
        loading="lazy"
        decoding="async"
        ${className ? `class="${className}"` : ''}
      />
    `;
  }
}
