import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Query } from '@nestjs/common';
import { LexicalSensesService } from './lexical-senses.service';

@Controller('api/lexical-senses')
export class LexicalSensesController {
  constructor(@Inject(LexicalSensesService) private readonly senses: LexicalSensesService) {}

  @Post('check') check(@Body() body: { items?: unknown }) { return this.senses.check(body); }
  @Post('generation-jobs') @HttpCode(HttpStatus.ACCEPTED) createGenerationJob(@Body() body: { items?: unknown; checkId?: unknown }) { return this.senses.createGenerationJob(body); }
  @Get('generation-jobs') generationJobs() { return this.senses.generationJobs(); }
  @Post('generation-jobs/:id/retry') retryGenerationJob(@Param('id') id: string) { return this.senses.retryGenerationJob(id); }
  @Get('generation-proposals') generationProposals() { return this.senses.generationProposals(); }
  @Post('generation-proposals/:id/save') saveGenerationProposal(@Param('id') id: string, @Body() body: { definition_pl?: unknown; confirmedDistinct?: unknown }) { return this.senses.saveGenerationProposal(id, body); }
  @Post('generation-proposals/:id/reject') @HttpCode(HttpStatus.NO_CONTENT) rejectGenerationProposal(@Param('id') id: string) { return this.senses.rejectGenerationProposal(id); }
  @Get() list(@Query('page') page?: string, @Query('search') search?: string) { return this.senses.list(page, search); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: { definition_it?: unknown; definition_pl?: unknown }) { return this.senses.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.senses.remove(id); }
}
