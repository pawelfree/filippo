import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClozeService } from './cloze.service';

@Controller('api/cloze')
export class ClozeController {
  constructor(@Inject(ClozeService) private readonly cloze: ClozeService) {}

  @Get('overview') overview() { return this.cloze.overview(); }
  @Post('sessions') create(@Body() body: { count?: unknown }) { return this.cloze.createSession(body?.count); }
  @Get('sessions') sessions() { return this.cloze.listSessions(); }
  @Get('sessions/:id') session(@Param('id') id: string) { return this.cloze.session(id); }
  @Post('sessions/:id/answers') answer(@Param('id') id: string, @Body() body: { eventId?: unknown; position?: unknown; responses?: unknown }) { return this.cloze.answer(id, body); }
}
