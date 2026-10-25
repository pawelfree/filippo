import { Body, Controller, Inject, Post } from '@nestjs/common';
import { LexicalSensesService } from './lexical-senses.service';

@Controller('api/lexical-senses')
export class LexicalSensesController {
  constructor(@Inject(LexicalSensesService) private readonly senses: LexicalSensesService) {}

  @Post('check') check(@Body() body: { items?: unknown }) { return this.senses.check(body); }
  @Post('generate') generate(@Body() body: { items?: unknown; checkId?: unknown }) { return this.senses.generate(body); }
  @Post('save') save(@Body() body: { draftId?: unknown; selected?: unknown }) { return this.senses.save(body); }
}
