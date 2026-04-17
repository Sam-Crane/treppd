import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  visa_expiry_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  anmeldung_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  roadmap_nudges_enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  digest_hour?: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}
