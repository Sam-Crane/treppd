import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: { userId: string }) {
    const profile = await this.profilesService.findByUserId(user.userId);
    if (!profile)
      throw new NotFoundException(
        'Profile not found. Complete onboarding first.',
      );
    return profile;
  }

  @Post()
  async createProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateProfileDto,
  ) {
    return await this.profilesService.create(user.userId, dto);
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return await this.profilesService.update(user.userId, dto);
  }

  @Delete('me')
  async deleteProfile(@CurrentUser() user: { userId: string }) {
    return await this.profilesService.delete(user.userId);
  }
}
