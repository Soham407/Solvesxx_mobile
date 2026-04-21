import { supabase } from './supabase';

const VISITORS_PHOTOS_BUCKET = 'visitor-photos';
const VISITOR_EVIDENCE_BUCKET = 'visitor-evidence';

/**
 * Compress image by converting to lower quality JPEG
 * For now, just return the original - actual compression in production
 */
async function compressImageIfNeeded(imageUri: string): Promise<string> {
  // Actual compression would use react-native-image-resizer or similar
  // For MVP, return original - backend can resize if needed
  console.log('[Upload] Using original image (no compression in MVP)');
  return imageUri;
}

/**
 * Upload visitor photo to Supabase bucket
 */
export async function uploadVisitorPhoto(input: {
  visitorId: string;
  imageUri: string;
  guardId?: string;
}) {
  if (!input.visitorId || !input.imageUri) {
    throw new Error('Visitor ID and image URI are required');
  }

  try {
    // Generate unique filename
    const filename = `${input.visitorId}-${Date.now()}.jpg`;
    const path = `${input.guardId ? input.guardId + '/' : ''}${filename}`;

    // Convert image URI to blob
    const response = await fetch(input.imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(VISITORS_PHOTOS_BUCKET)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('[Upload] Visitor photo uploaded:', data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(VISITORS_PHOTOS_BUCKET).getPublicUrl(path);

    return {
      url: publicUrl,
      path: data.path,
      size: blob.size,
    };
  } catch (error) {
    console.error('[Upload] Visitor photo upload failed:', error);
    throw error;
  }
}

/**
 * Upload checklist evidence photo to Supabase bucket
 */
export async function uploadChecklistEvidencePhoto(input: {
  checklistItemId: string;
  imageUri: string;
  guardId?: string;
}) {
  if (!input.checklistItemId || !input.imageUri) {
    throw new Error('Checklist item ID and image URI are required');
  }

  try {
    // Generate unique filename
    const filename = `${input.checklistItemId}-${Date.now()}.jpg`;
    const path = `${input.guardId ? input.guardId + '/' : ''}${filename}`;

    // Convert image URI to blob
    const response = await fetch(input.imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(VISITOR_EVIDENCE_BUCKET)
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('[Upload] Checklist evidence uploaded:', data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(VISITOR_EVIDENCE_BUCKET).getPublicUrl(path);

    return {
      url: publicUrl,
      path: data.path,
      size: blob.size,
    };
  } catch (error) {
    console.error('[Upload] Checklist evidence upload failed:', error);
    throw error;
  }
}

/**
 * Delete photo from Supabase bucket
 */
export async function deletePhoto(input: {
  photoPath: string;
  bucket?: 'visitor-photos' | 'visitor-evidence';
}) {
  const bucket = input.bucket || 'visitor-photos';

  try {
    const { error } = await supabase.storage.from(bucket).remove([input.photoPath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    console.log('[Delete] Photo deleted:', input.photoPath);
    return { success: true };
  } catch (error) {
    console.error('[Delete] Photo deletion failed:', error);
    throw error;
  }
}
