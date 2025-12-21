/**
 * Image Compression Utility
 * Compresses images to ~512KB while maintaining quality
 */

interface CompressionOptions {
    maxSizeKB?: number;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
    maxSizeKB: 512,
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
};

/**
 * Compress an image file to the specified size
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed image as a Blob
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Create an image element to load the file
    const img = await createImageFromFile(file);

    // Calculate new dimensions
    let { width, height } = img;
    const maxWidth = opts.maxWidth!;
    const maxHeight = opts.maxHeight!;

    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(img, 0, 0, width, height);

    // Start with the specified quality and reduce if needed
    let quality = opts.quality!;
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    // Iteratively reduce quality until we hit target size
    const maxSizeBytes = opts.maxSizeKB! * 1024;
    while (blob.size > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }

    console.log(`Image compressed: ${(file.size / 1024).toFixed(0)}KB -> ${(blob.size / 1024).toFixed(0)}KB`);

    return blob;
}

/**
 * Create an image element from a file
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Convert canvas to blob with specified quality
 */
function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Canvas toBlob failed'));
            },
            type,
            quality
        );
    });
}

/**
 * Compress and convert to File object
 */
export async function compressImageToFile(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const blob = await compressImage(file, options);
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now(),
    });
}
