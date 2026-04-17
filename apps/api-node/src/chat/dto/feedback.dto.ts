import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class FeedbackDto {
  @IsUUID()
  log_id: string;

  /** 1 = helpful, -1 = unhelpful (matches ai_feedback.rating column) */
  @IsIn([1, -1])
  rating: 1 | -1;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
