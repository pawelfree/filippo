import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ExerciseGenerationInputService } from './exercise-generation-input.service';

@Controller('api/lexical-senses')
export class ExerciseGenerationInputController {
  constructor(@Inject(ExerciseGenerationInputService) private readonly inputs: ExerciseGenerationInputService) {}

  @Post('exercise-generation-input')
  @HttpCode(HttpStatus.OK)
  prepare(@Body() body: { ids?: unknown }) { return this.inputs.prepare(body?.ids); }
}
