import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { TaxonomyController } from './taxonomy/taxonomy.controller';
import { TaxonomyService } from './taxonomy/taxonomy.service';

@Module({
  imports: [ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'public') })],
  controllers: [TaxonomyController],
  providers: [TaxonomyService],
})
export class AppModule {}
