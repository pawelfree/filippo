import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { StudyService } from './study.service';

@Controller('api/study')
export class StudyController {
  constructor(@Inject(StudyService) private readonly study: StudyService) {}

  @Get('overview') overview() { return this.study.overview(); }
  @Get('next') next() { return this.study.next(); }
  @Post('attempts') record(@Body() body: { eventId?: unknown; lexicalSenseId?: unknown; presentationToken?: unknown; rating?: unknown }) { return this.study.record(body); }
  @Post('reset') reset() { return this.study.reset(); }
}
