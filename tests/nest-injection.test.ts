import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ProfileController } from '../src/profile/profile.controller';
import { ProfileService } from '../src/profile/profile.service';
import { TaxonomyController } from '../src/taxonomy/taxonomy.controller';
import { TaxonomyService } from '../src/taxonomy/taxonomy.service';

@Module({
  controllers: [TaxonomyController, ProfileController],
  providers: [TaxonomyService, ProfileService],
})
class ProfileContextModule {}

test('ProfileService receives TaxonomyService in the Nest container', async () => {
  const app = await NestFactory.createApplicationContext(ProfileContextModule, { logger: false });

  try {
    const profileService = app.get(ProfileService);
    assert.ok(profileService.getProfile().competencies.length > 0);
    assert.ok(app.get(ProfileController));
    assert.ok(app.get(TaxonomyController));
  } finally {
    await app.close();
  }
});
