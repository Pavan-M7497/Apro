import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Uploads an image to a Supabase storage bucket and returns its public URL.
 *
 * Requires two PUBLIC storage buckets created manually in the Supabase
 * dashboard:
 *   - 'avatars' — profile photos, 5MB limit
 *   - 'covers'  — profile banners, 10MB limit
 */
export function useImageUpload(bucket: string) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File, path: string): Promise<string | null> => {
    if (!file) return null;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.');
      return null;
    }
    const maxSize = bucket === 'covers' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Image must be under ${bucket === 'covers' ? '10' : '5'}MB.`);
      return null;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${path}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
