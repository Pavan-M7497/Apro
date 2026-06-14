import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Storage buckets used by the app — create these in the Supabase Storage
 * dashboard (both PUBLIC) if they don't already exist:
 *   - 'avatars' — profile photos, 5MB max
 *   - 'covers'  — profile banners, 10MB max
 *   - 'verification-docs' — achievement proof uploads
 */
