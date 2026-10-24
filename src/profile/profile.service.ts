import { Injectable } from '@nestjs/common';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import { loadCompetenceProfile } from './profile.loader';
import type { CompetenceProfile } from './profile.types';

@Injectable()
export class ProfileService {
  private readonly profile: CompetenceProfile;

  constructor(taxonomyService: TaxonomyService) {
    this.profile = loadCompetenceProfile(taxonomyService.getAll());
  }

  getProfile(): CompetenceProfile {
    return this.profile;
  }
}
