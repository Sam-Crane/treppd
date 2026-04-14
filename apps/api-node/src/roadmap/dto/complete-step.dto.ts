import { IsBoolean, IsOptional } from 'class-validator';

export class CompleteStepDto {
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
