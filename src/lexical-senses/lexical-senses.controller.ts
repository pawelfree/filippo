import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { LexicalSensesService } from './lexical-senses.service';

@Controller('api/lexical-senses')
export class LexicalSensesController {
  constructor(@Inject(LexicalSensesService) private readonly senses: LexicalSensesService) {}

  @Post('check') check(@Body() body: { items?: unknown }) { return this.senses.check(body); }
  @Post('generate') generate(@Body() body: { items?: unknown; checkId?: unknown }) { return this.senses.generate(body); }
  @Post('save') save(@Body() body: { draftId?: unknown; selected?: unknown }) { return this.senses.save(body); }
  @Get() list() { return this.senses.list(); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: { definition_it?: unknown; definition_pl?: unknown }) { return this.senses.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.senses.remove(id); }
}
