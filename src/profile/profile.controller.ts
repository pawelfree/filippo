import { Controller, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';
import type { CompetenceProfile } from './profile.types';

@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(): CompetenceProfile {
    return this.profileService.getProfile();
  }
}
