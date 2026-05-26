import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateWatchDto {
  /** Optional link to a curated office (enables active change-detection). */
  @IsOptional()
  @IsString()
  office_id?: string;

  /** The booking portal URL to watch. */
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  booking_url: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  service_label?: string;
}
