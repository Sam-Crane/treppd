import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

/** POST /admin/ingest body — proxied to the Python /admin/ingest endpoint. */
export class IngestDto {
  /** Optional URL-substring filters; omit to ingest every curated source. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  only?: string[];

  /** Fetch + chunk only, without embedding or writing. */
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
