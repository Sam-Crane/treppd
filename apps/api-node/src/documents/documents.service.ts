/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

const STORAGE_BUCKET = 'user-documents';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);
const SIGNED_UPLOAD_TTL_SECONDS = 60 * 5; // 5 min to finish upload
const SIGNED_READ_TTL_SECONDS = 60 * 60; // 1 hr to view

export interface UploadUrlRequest {
  document_name_en: string;
  step_slug?: string;
  mime_type: string;
  file_size_bytes: number;
  display_name?: string;
}

export interface FinalizeUploadRequest {
  storage_path: string;
  document_name_en: string;
  step_slug?: string;
  mime_type: string;
  file_size_bytes: number;
  display_name?: string;
  expires_at?: string;
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

@Injectable()
export class DocumentsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
  ) {}

  // --------------------------------------------------------- checklist (read)

  async getChecklist(userId: string) {
    const { data: roadmap, error: roadmapError } = await this.supabase
      .getClient()
      .from('user_roadmaps')
      .select('steps')
      .eq('user_id', userId)
      .single();

    if (roadmapError || !roadmap) {
      throw new NotFoundException(
        'No active roadmap found. Generate a roadmap first.',
      );
    }

    const steps = roadmap.steps as Array<{ slug: string; title: string }>;
    const stepSlugs = steps.map((s) => s.slug);

    const { data: requirements } = await this.supabase
      .getClient()
      .from('document_requirements')
      .select('*')
      .in('step_slug', stepSlugs);

    // Also pull uploaded docs so the UI can show status per required item.
    const { data: uploads } = await this.supabase
      .getClient()
      .from('user_documents')
      .select(
        'id, step_slug, document_name_en, storage_path, uploaded_at, mime_type, file_size_bytes, display_name',
      )
      .eq('user_id', userId)
      .in('step_slug', stepSlugs);

    const uploadsByKey = new Map<string, Array<Record<string, unknown>>>();
    for (const u of (uploads ?? []) as Array<Record<string, unknown>>) {
      const key = `${String(u.step_slug)}::${String(u.document_name_en).toLowerCase()}`;
      const bucket = uploadsByKey.get(key) ?? [];
      bucket.push(u);
      uploadsByKey.set(key, bucket);
    }

    return steps.map((step) => ({
      step_slug: step.slug,
      step_title: step.title,
      documents: ((requirements ?? []) as Array<Record<string, unknown>>)
        .filter((d) => d.step_slug === step.slug)
        .map((d) => {
          const key = `${step.slug}::${String(d.document_name_en).toLowerCase()}`;
          const matched = uploadsByKey.get(key) ?? [];
          return {
            ...d,
            uploaded_count: matched.length,
            uploads: matched,
          };
        }),
    }));
  }

  async getChecklistByStep(userId: string, stepSlug: string) {
    const { data: roadmap } = await this.supabase
      .getClient()
      .from('user_roadmaps')
      .select('steps')
      .eq('user_id', userId)
      .single();

    if (!roadmap) throw new NotFoundException('No active roadmap found.');

    const steps = roadmap.steps as Array<{ slug: string; title: string }>;
    const step = steps.find((s) => s.slug === stepSlug);
    if (!step) {
      throw new NotFoundException(`Step "${stepSlug}" not found in roadmap.`);
    }

    const { data: requirements } = await this.supabase
      .getClient()
      .from('document_requirements')
      .select('*')
      .eq('step_slug', stepSlug);

    return {
      step_slug: step.slug,
      step_title: step.title,
      documents: requirements ?? [],
    };
  }

  // --------------------------------------------------------- upload (write)

  /**
   * Produce a short-lived signed URL the browser uses to PUT the file bytes
   * directly to Supabase Storage, bypassing NestJS entirely.
   * The client then calls `finalize` to record metadata.
   */
  async createUploadUrl(userId: string, dto: UploadUrlRequest) {
    if (!ALLOWED_MIME_TYPES.has(dto.mime_type)) {
      throw new BadRequestException(
        `Unsupported file type "${dto.mime_type}". Allowed: PDF, JPG, PNG, HEIC.`,
      );
    }
    if (dto.file_size_bytes <= 0 || dto.file_size_bytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File is too large or invalid. Max size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
      );
    }

    const documentId = randomUUID();
    const storagePath = `${userId}/${documentId}`;

    const { data, error } = await this.supabase
      .getClient()
      .storage.from(STORAGE_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data) {
      this.logger.warn({ err: error }, 'Failed to create signed upload URL');
      throw new BadRequestException(
        'Could not prepare upload. Please try again.',
      );
    }

    return {
      storage_path: storagePath,
      signed_url: data.signedUrl,
      token: data.token,
      expires_in_seconds: SIGNED_UPLOAD_TTL_SECONDS,
    };
  }

  /**
   * After a successful storage upload, the client calls finalize to persist
   * the metadata row. We verify the file actually exists in storage before
   * creating the row to prevent orphan records.
   */
  async finalizeUpload(userId: string, dto: FinalizeUploadRequest) {
    // Guard: storage path must start with the user's own UUID prefix
    if (!dto.storage_path.startsWith(`${userId}/`)) {
      throw new BadRequestException('Invalid storage path.');
    }

    // Existence check — save a round-trip by relying on Supabase's returned
    // metadata shape. If the file isn't there, createSignedUrl throws.
    const { data: signed, error: readError } = await this.supabase
      .getClient()
      .storage.from(STORAGE_BUCKET)
      .createSignedUrl(dto.storage_path, 60);

    if (readError || !signed) {
      throw new BadRequestException(
        'Uploaded file not found. Please retry the upload.',
      );
    }

    const row = {
      user_id: userId,
      step_slug: dto.step_slug ?? null,
      document_name_en: dto.document_name_en,
      storage_path: dto.storage_path,
      display_name: dto.display_name ?? null,
      mime_type: dto.mime_type,
      file_size_bytes: dto.file_size_bytes,
      expires_at: dto.expires_at ?? null,
    };

    const { data, error } = await this.supabase
      .getClient()
      .from('user_documents')
      .insert(row)
      .select('*')
      .single();

    if (error || !data) {
      this.logger.warn({ err: error }, 'Failed to insert user_documents row');
      throw new BadRequestException('Could not save document metadata.');
    }

    return data as UserDocument;
  }

  async listDocuments(userId: string): Promise<UserDocument[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error || !data) return [];
    return data as UserDocument[];
  }

  async getSignedReadUrl(
    userId: string,
    documentId: string,
  ): Promise<{ url: string; expires_in_seconds: number }> {
    const { data: doc, error } = await this.supabase
      .getClient()
      .from('user_documents')
      .select('storage_path')
      .eq('user_id', userId)
      .eq('id', documentId)
      .maybeSingle();

    if (error || !doc) throw new NotFoundException('Document not found.');

    const { data: signed, error: signError } = await this.supabase
      .getClient()
      .storage.from(STORAGE_BUCKET)
      .createSignedUrl(
        (doc as { storage_path: string }).storage_path,
        SIGNED_READ_TTL_SECONDS,
      );

    if (signError || !signed) {
      throw new BadRequestException('Could not create a preview URL.');
    }
    return {
      url: signed.signedUrl,
      expires_in_seconds: SIGNED_READ_TTL_SECONDS,
    };
  }

  async deleteDocument(userId: string, documentId: string) {
    const { data: doc } = await this.supabase
      .getClient()
      .from('user_documents')
      .select('storage_path')
      .eq('user_id', userId)
      .eq('id', documentId)
      .maybeSingle();

    if (!doc) throw new NotFoundException('Document not found.');

    // Best-effort storage delete first. If it fails (already gone, network),
    // we still remove the DB row so the UI stays consistent.
    await this.supabase
      .getClient()
      .storage.from(STORAGE_BUCKET)
      .remove([(doc as { storage_path: string }).storage_path]);

    const { error } = await this.supabase
      .getClient()
      .from('user_documents')
      .delete()
      .eq('user_id', userId)
      .eq('id', documentId);

    if (error) {
      this.logger.warn({ err: error }, 'Failed to delete user_documents row');
    }

    return { ok: true };
  }
}
