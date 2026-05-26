import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HousingService } from './housing.service';
import { WbsEstimateDto, WohngeldEstimateDto } from './dto/estimate.dto';

@ApiTags('housing')
@ApiBearerAuth()
@Controller('housing')
@UseGuards(JwtAuthGuard)
export class HousingController {
  constructor(private readonly housingService: HousingService) {}

  @Get('offices')
  listOffices(
    @Query('bundesland') bundesland?: string,
    @Query('city') city?: string,
  ) {
    return this.housingService.listOffices(bundesland, city);
  }

  @Post('wbs-estimate')
  wbs(@Body() dto: WbsEstimateDto) {
    return this.housingService.wbs(dto);
  }

  @Post('wohngeld-estimate')
  wohngeld(@Body() dto: WohngeldEstimateDto) {
    return this.housingService.wohngeld(dto);
  }
}
