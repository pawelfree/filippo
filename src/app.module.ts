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
import { ExerciseGenerationInputController } from './exercise-generation-input/exercise-generation-input.controller';
import { ExerciseGenerationInputService } from './exercise-generation-input/exercise-generation-input.service';
import { FsrsService } from './fsrs/fsrs.service';
import { StudyController } from './study/study.controller';
import { StudyService } from './study/study.service';
import { StudyStatisticsController } from './study/study-statistics.controller';
import { StudyStatisticsService } from './study/study-statistics.service';
import { StudySimulationController } from './study/study-simulation.controller';
import { StudySimulationService } from './study/study-simulation.service';

@Module({
  imports: [DatabaseModule, ServeStaticModule.forRoot(
    { rootPath: join(process.cwd(), 'dist', 'browser'), serveRoot: '/assets' },
    { rootPath: join(process.cwd(), 'public') },
  )],
  controllers: [TaxonomyController, ProfileController, LexicalSensesController, ExerciseGenerationInputController, StudyController, StudyStatisticsController, StudySimulationController],
  providers: [TaxonomyService, ProfileService, LexicalSensesService, ExerciseGenerationInputService, FsrsService, StudyService, StudyStatisticsService, StudySimulationService],
})
export class AppModule {}
