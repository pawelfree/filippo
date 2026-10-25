import { Controller, Get, Inject } from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import type { Taxonomy } from './taxonomy.types';

@Controller('api/taxonomy')
export class TaxonomyController {
  constructor(@Inject(TaxonomyService) private readonly taxonomyService: TaxonomyService) {}

  @Get()
  getAll(): Taxonomy {
    return this.taxonomyService.getAll();
  }
}
