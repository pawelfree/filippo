import { Body, Controller, Inject, Post } from '@nestjs/common';
import { StudySimulationService } from './study-simulation.service';

@Controller('api/study/simulation')
export class StudySimulationController {
  constructor(@Inject(StudySimulationService) private readonly simulation: StudySimulationService) {}

  @Post()
  simulate(@Body() body: unknown) {
    return this.simulation.simulate(body);
  }
}
