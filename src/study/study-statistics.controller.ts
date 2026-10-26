import { Controller, Get, Inject, Query } from '@nestjs/common';
import { StudyStatisticsService } from './study-statistics.service';

@Controller('api/study/statistics')
export class StudyStatisticsController {
  constructor(@Inject(StudyStatisticsService) private readonly statistics: StudyStatisticsService) {}

  @Get()
  overview(@Query('history') history?: string, @Query('schedule') schedule?: string) {
    return this.statistics.overview(history, undefined, schedule);
  }

  @Get('memory')
  memory() {
    return this.statistics.memory();
  }
}
