import { IsIn, IsInt, IsNumber, Min } from 'class-validator';

const BUNDESLAENDER = [
  'DE-BW',
  'DE-BY',
  'DE-BE',
  'DE-BB',
  'DE-HB',
  'DE-HH',
  'DE-HE',
  'DE-MV',
  'DE-NI',
  'DE-NW',
  'DE-RP',
  'DE-SL',
  'DE-SN',
  'DE-ST',
  'DE-SH',
  'DE-TH',
];

export class WbsEstimateDto {
  @IsIn(BUNDESLAENDER)
  bundesland: string;

  @IsInt()
  @Min(1)
  household_size: number;

  @IsNumber()
  @Min(0)
  annual_net_income_eur: number;
}

export class WohngeldEstimateDto {
  @IsIn(BUNDESLAENDER)
  bundesland: string;

  @IsInt()
  @Min(1)
  household_size: number;

  @IsNumber()
  @Min(0)
  monthly_net_income_eur: number;

  @IsNumber()
  @Min(0)
  monthly_rent_eur: number;
}
