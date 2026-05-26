import { IsIn } from 'class-validator';

/** POST /admin/providers/logo-upload-url body. */
export class LogoUploadDto {
  @IsIn(['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
  mime_type: string;
}
