import { api } from '../services/api';

/**
 * Compress an image file to a lightweight 300x300 JPEG data URL
 */
export function compressImageFile(file, size = 300) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;
        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload an image file to ImgBB (with local compression fallback)
 */
export async function uploadImageToImgBB(file) {
  // First compress locally
  const compressedBase64 = await compressImageFile(file, 300);

  // Try direct browser ImgBB API upload with VITE_IMGBB_API_KEY
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY || '17a29cfdaadee395de8713b7c83ab95d';
  if (apiKey) {
    try {
      const formData = new FormData();
      // Remove header prefix for raw base64
      const cleanBase64 = compressedBase64.replace(/^data:image\/\w+;base64,/, '');
      formData.append('image', cleanBase64);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        return {
          url: data.data.url,
          isImgBB: true,
        };
      }
    } catch (err) {
      console.warn('Client ImgBB upload attempt error, trying backend proxy:', err.message);
    }
  }

  // Next try backend upload-avatar endpoint
  try {
    const backendRes = await api.uploadAvatar({ image: compressedBase64 });
    if (backendRes.success && backendRes.url) {
      return {
        url: backendRes.url,
        isImgBB: !backendRes.isFallback,
      };
    }
  } catch (err) {
    console.warn('Backend proxy upload attempt error:', err.message);
  }

  // Return compressed base64 as guaranteed fallback
  return {
    url: compressedBase64,
    isImgBB: false,
  };
}
