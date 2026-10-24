import { Injectable } from '@nestjs/common';
import { loadTaxonomy } from './taxonomy.loader';
import type { Taxonomy } from './taxonomy.types';

@Injectable()
export class TaxonomyService {
  private readonly taxonomy: Taxonomy = loadTaxonomy();

  getAll(): Taxonomy {
    return this.taxonomy;
  }
}
