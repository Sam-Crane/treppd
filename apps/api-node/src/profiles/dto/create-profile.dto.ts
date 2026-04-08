import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsIn(['student', 'work', 'job_seeker', 'family', 'freelance', 'au_pair'])
  visa_type: string;

  @IsString()
  @IsNotEmpty()
  bundesland: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsIn([
    'initial_setup',
    'visa_renewal',
    'change_visa',
    'family_reunion',
    'job_change',
  ])
  goal: string;

  @IsOptional()
  @IsDateString()
  arrival_date?: string;

  @IsOptional()
  @IsDateString()
  visa_expiry_date?: string;

  @IsOptional()
  @IsString()
  employer_name?: string;

  @IsOptional()
  @IsString()
  university_name?: string;
}
