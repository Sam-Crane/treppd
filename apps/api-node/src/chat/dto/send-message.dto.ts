import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  @MaxLength(2000, { message: 'Message must be 2000 characters or fewer' })
  message: string;

  @IsOptional()
  @IsString()
  context_type?: string;

  @IsOptional()
  @IsString()
  related_step_slug?: string;
}
