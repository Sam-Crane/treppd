import { IsObject } from 'class-validator';

/**
 * POST /forms/:form_code/session body.
 *
 * `values` is a shallow map of field_id → value (string | number | boolean).
 * We cap the payload size in the controller rather than here — a large
 * form still needs to hold ~100 KV pairs.
 */
export class SaveSessionDto {
  @IsObject()
  values: Record<string, string | number | boolean>;
}

// Helper enforced by the controller before hitting the service.
export const MAX_SESSION_KEYS = 150;
export const MAX_SESSION_VALUE_LENGTH = 1000;
