import {
  IsArray,
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Supported process_type keys — MUST stay in sync with
 * apps/api-python/prompts/appointment_email_prompt.py PROCESS_LABELS keys.
 */
export const PROCESS_TYPES = [
  'aufenthaltstitel',
  'verlaengerung',
  'familienzusammenfuehrung',
  'anmeldung',
  'eat_abholung',
] as const;

export type ProcessType = (typeof PROCESS_TYPES)[number];

export class OfficeDetailsDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requested_dates?: string[];
}

export class GenerateAppointmentEmailDto {
  @IsIn(PROCESS_TYPES)
  process_type: ProcessType;

  @IsObject()
  @ValidateNested()
  @Type(() => OfficeDetailsDto)
  office_details: OfficeDetailsDto;
}
