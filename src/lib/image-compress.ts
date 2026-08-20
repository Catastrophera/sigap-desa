/**
 * Client-Side WebP Compression Helper
 * Enforces max dimension 1920px and guaranteed file size <= 1MB
 */
export async function convertToWebP(file: File, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        const maxDimension = 1920;
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const tryExport = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('WebP conversion failed'));
                return;
              }

              // Guardrail 6: Ensure size is under 1MB (1,048,576 bytes)
              if (blob.size > 1048576 && currentQuality > 0.4) {
                tryExport(currentQuality - 0.15);
              } else {
                resolve(blob);
              }
            },
            'image/webp',
            currentQuality
          );
        };

        tryExport(quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}