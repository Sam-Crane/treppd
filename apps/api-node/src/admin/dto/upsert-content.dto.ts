import { IsObject } from 'class-validator';

/**
 * POST /admin/content/:resource body. `row` is the full record to upsert.
 * Per-resource validation (allowed table, enum fields, verified_at stamping)
 * happens in AdminService against a fixed whitelist — the client never names
 * the table directly.
 */
export class UpsertContentDto {
  @IsObject()
  row: Record<string, unknown>;
}
