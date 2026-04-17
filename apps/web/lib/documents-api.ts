/**
 * Typed client for the Documents module (Phase 3f).
 *
 * Upload flow:
 *   1. POST /documents/upload-url  → signed URL for PUT to storage
 *   2. PUT <signed_url> <file>    → browser uploads directly to Supabase Storage
 *   3. POST /documents/finalize   → record metadata row
 */
import { api } from './api';

export interface SignedUploadUrl {
  storage_path: string;
  signed_url: string;
  token: string;
  expires_in_seconds: number;
}

export interface UserDocument {
  id: string;
  user_id: string;
  step_slug: string | null;
  document_name_en: string;
  storage_path: string;
  display_name: string | null;
  mime_type: string;
  file_size_bytes: number;
  uploaded_at: string;
  expires_at: string | null;
}

export interface DocumentRequirementWithUploads {
  document_name_en: string;
  document_name_de: string;
  specifications: Record<string, unknown> | null;
  needs_certified_copy: boolean;
  needs_translation: boolean;
  needs_apostille: boolean;
  where_to_get: string | null;
  estimated_cost_eur: number | null;
  uploaded_count: number;
  uploads: Array<{
    id: string;
    display_name: string | null;
    storage_path: string;
    uploaded_at: string;
    mime_type: string;
    file_size_bytes: number;
  }>;
}

export interface ChecklistGroup {
  step_slug: string;
  step_title: string;
  documents: DocumentRequirementWithUploads[];
}

export const documentsApi = {
  checklist: () => api.get<ChecklistGroup[]>('/documents/checklist'),

  list: () => api.get<UserDocument[]>('/documents'),

  downloadUrl: (id: string) =>
    api.get<{ url: string; expires_in_seconds: number }>(
      `/documents/${id}/download-url`,
    ),

  delete: (id: string) => api.delete<{ ok: true }>(`/documents/${id}`),

  /** Request a signed upload URL for a new file. */
  requestUploadUrl: (payload: {
    document_name_en: string;
    step_slug?: string;
    mime_type: string;
    file_size_bytes: number;
    display_name?: string;
  }) => api.post<SignedUploadUrl>('/documents/upload-url', payload),

  /** Persist metadata after the browser completes the Storage PUT. */
  finalize: (payload: {
    storage_path: string;
    document_name_en: string;
    step_slug?: string;
    mime_type: string;
    file_size_bytes: number;
    display_name?: string;
    expires_at?: string;
  }) => api.post<UserDocument>('/documents/finalize', payload),
};

/**
 * End-to-end upload helper: upload-url → PUT to storage → finalize.
 * Resolves to the persisted metadata row.
 */
export async function uploadDocument(file: File, opts: {
  document_name_en: string;
  step_slug?: string;
  display_name?: string;
}): Promise<UserDocument> {
  const signed = await documentsApi.requestUploadUrl({
    document_name_en: opts.document_name_en,
    step_slug: opts.step_slug,
    mime_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
    display_name: opts.display_name ?? file.name,
  });

  const putResponse = await fetch(signed.signed_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error(`Upload failed (${putResponse.status})`);
  }

  return documentsApi.finalize({
    storage_path: signed.storage_path,
    document_name_en: opts.document_name_en,
    step_slug: opts.step_slug,
    mime_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
    display_name: opts.display_name ?? file.name,
  });
}
