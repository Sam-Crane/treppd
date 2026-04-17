import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UploadUrlRequestDto {
  @IsString()
  @MaxLength(300)
  document_name_en: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  step_slug?: string;

  @IsString()
  @MaxLength(100)
  mime_type: string;

  @IsInt()
  @Min(1)
  file_size_bytes: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  display_name?: string;
}

export class FinalizeUploadDto {
  @IsString()
  @MaxLength(500)
  storage_path: string;

  @IsString()
  @MaxLength(300)
  document_name_en: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  step_slug?: string;

  @IsString()
  @MaxLength(100)
  mime_type: string;

  @IsInt()
  @Min(1)
  file_size_bytes: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  display_name?: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;
}
