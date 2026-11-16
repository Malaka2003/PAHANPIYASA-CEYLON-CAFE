export function slotKeyToDocId(slotKey: string): string {
  const normalized = slotKey.replace(/[^a-zA-Z0-9_-]/g, '__').slice(0, 128);
  return normalized || 'media_slot';
}

export async function processImageFile(
  file: File,
  maxDimension = 1280,
  maxCharLength = 380000
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPG, PNG, or WebP).');
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read the selected image.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () =>
      reject(new Error('Selected file could not be decoded as an image.'));
    element.src = rawDataUrl;
  });

  const { naturalWidth, naturalHeight } = img;
  if (!naturalWidth || !naturalHeight) {
    if (rawDataUrl.length > maxCharLength) {
      throw new Error('Image is too large to upload. Please select a smaller photo.');
    }
    return rawDataUrl;
  }

  const longestSide = Math.max(naturalWidth, naturalHeight);
  let currentScale = longestSide > maxDimension ? maxDimension / longestSide : 1;

  for (let attempt = 0; attempt < 5; attempt++) {
    const targetWidth = Math.max(120, Math.round(naturalWidth * currentScale));
    const targetHeight = Math.max(120, Math.round(naturalHeight * currentScale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return rawDataUrl;
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const qualities = [0.82, 0.72, 0.62, 0.5];
    for (const quality of qualities) {
      const candidate = canvas.toDataURL('image/jpeg', quality);
      if (candidate.length <= maxCharLength) {
        return candidate;
      }
    }

    currentScale *= 0.75;
  }

  throw new Error(
    'This photo is too detailed to save cleanly. Try cropping or selecting a smaller image.'
  );
}
