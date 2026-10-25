import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { TaxonomyController } from './taxonomy/taxonomy.controller';
import { TaxonomyService } from './taxonomy/taxonomy.service';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { DatabaseModule } from './database/database.module';
import { LexicalSensesController } from './lexical-senses/lexical-senses.controller';
import { LexicalSensesService } from './lexical-senses/lexical-senses.service';

@Module({
  imports: [DatabaseModule, ServeStaticModule.forRoot(
    { rootPath: join(process.cwd(), 'dist', 'browser'), serveRoot: '/assets' },
    { rootPath: join(process.cwd(), 'public') },
  )],
  controllers: [TaxonomyController, ProfileController, LexicalSensesController],
  providers: [TaxonomyService, ProfileService, LexicalSensesService],
})
export class AppModule {}
