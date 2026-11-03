import { BadRequestException, Inject, Injectable, NotFoundException, ServiceUnavailableException, UnprocessableEntityException } from '@nestjs/common';
import Ajv2020 from 'ajv/dist/2020';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaService } from '../database/prisma.service';

interface ExerciseSenseInput {
  id: string;
  lexical_item_it: string;
  part_of_speech: string;
  definition_it: string;
  definition_pl: string;
  usage: {
    register: string;
    patterns_it: string[];
    collocations_it: string[];
    constraints_pl: string[];
  };
  examples_it?: string[];
}

export interface ExerciseGenerationInput {
  lexical_senses: ExerciseSenseInput[];
}

const schema = JSON.parse(readFileSync(join(process.cwd(), '.ai/docs/generate-lexical-exercises/references/lexical_sense_input.schema.json'), 'utf8')) as object;
const validateSenseInput = new Ajv2020().compile<ExerciseSenseInput>(schema);
const maxSenses = 100;

@Injectable()
export class ExerciseGenerationInputService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async prepare(idsInput: unknown): Promise<ExerciseGenerationInput> {
    if (!Array.isArray(idsInput) || idsInput.length === 0 || idsInput.length > maxSenses
      || idsInput.some((id) => typeof id !== 'string' || !id.trim() || id !== id.trim())) {
      throw new BadRequestException(`Podaj od 1 do ${maxSenses} niepustych identyfikatorów znaczeń.`);
    }
    const ids = idsInput as string[];
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Lista zawiera powtórzone identyfikatory znaczeń.');

    let records;
    try {
      records = await this.prisma.lexicalSense.findMany({ where: { id: { in: ids } } });
    } catch {
      throw new ServiceUnavailableException('Nie udało się odczytać znaczeń z bazy.');
    }
    const byId = new Map(records.map((record) => [record.id, record]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length) throw new NotFoundException(`Nie znaleziono znaczeń o ID: ${missing.join(', ')}.`);

    const lexical_senses = ids.map((id) => {
      const record = byId.get(id)!;
      let details: Record<string, unknown>;
      try {
        const parsed: unknown = JSON.parse(record.detailsJson || 'null');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid details');
        details = parsed as Record<string, unknown>;
      } catch {
        throw new UnprocessableEntityException(`Znaczenie ${id} nie ma poprawnych szczegółów do generowania ćwiczeń.`);
      }
      const examples_it = Array.isArray(details.examples)
        ? details.examples.map((example) => example && typeof example === 'object' ? (example as Record<string, unknown>).sentence_it : undefined)
        : undefined;
      const projection: unknown = {
        id: record.id,
        lexical_item_it: record.lexicalItem,
        part_of_speech: details.part_of_speech,
        definition_it: record.definition,
        definition_pl: details.definition_pl,
        usage: details.usage,
        ...(examples_it === undefined ? {} : { examples_it }),
      };
      if (record.language !== 'it' || !validateSenseInput(projection)) {
        throw new UnprocessableEntityException(`Znaczenie ${id} nie spełnia kontraktu wejścia generatora ćwiczeń.`);
      }
      return projection;
    });

    return { lexical_senses };
  }
}
