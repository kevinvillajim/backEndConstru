// src/domain/repositories/CalculationParameterRepository.ts
import {
	CalculationParameter,
	CreateCalculationParameterDTO,
	UpdateCalculationParameterDTO,
} from "../models/calculation/CalculationParameter";

export interface CalculationParameterRepository {
	findById(id: string): Promise<CalculationParameter | null>;
	findByTemplateId(templateId: string): Promise<CalculationParameter[]>;
	findByDependency(parameterId: string): Promise<CalculationParameter[]>;
	create(
		parameter: CreateCalculationParameterDTO
	): Promise<CalculationParameter>;
	createMany(
		parameters: CreateCalculationParameterDTO[]
	): Promise<CalculationParameter[]>;
	update(
		id: string,
		parameterData: UpdateCalculationParameterDTO
	): Promise<CalculationParameter | null>;
	delete(id: string): Promise<boolean>;
	deleteByTemplateId(templateId: string): Promise<boolean>;
}
