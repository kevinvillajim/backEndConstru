// src/domain/services/CalculationService.ts
import {CalculationTemplate} from "../models/calculation/CalculationTemplate";
import {
	CalculationParameter,
	ParameterScope,
} from "../models/calculation/CalculationParameter";
import {CalculationResponse} from "../models/calculation/CalculationResult";

export class CalculationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CalculationError";
	}
}

export class CalculationService {
	/**
	 * Valida los parámetros de entrada contra la definición de la plantilla
	 */
	validateInputParameters(
		parameters: CalculationParameter[],
		inputValues: Record<string, any>
	): {isValid: boolean; errors: string[]} {
		const errors: string[] = [];
		const inputParameters = parameters.filter(
			(p) => p.scope === ParameterScope.INPUT
		);

		// Verificar parámetros requeridos
		for (const param of inputParameters) {
			if (
				param.isRequired &&
				(inputValues[param.name] === undefined ||
					inputValues[param.name] === null)
			) {
				errors.push(`El parámetro ${param.name} es requerido`);
				continue;
			}

			if (inputValues[param.name] === undefined) continue;

			const value = inputValues[param.name];

			// Validar tipo de datos
			switch (param.dataType) {
				case "number":
					if (typeof value !== "number") {
						errors.push(`El parámetro ${param.name} debe ser un número`);
					} else {
						// Validar rango si está especificado
						if (param.minValue !== undefined && value < param.minValue) {
							errors.push(
								`El parámetro ${param.name} debe ser mayor o igual a ${param.minValue}`
							);
						}
						if (param.maxValue !== undefined && value > param.maxValue) {
							errors.push(
								`El parámetro ${param.name} debe ser menor o igual a ${param.maxValue}`
							);
						}
					}
					break;
				case "string":
					if (typeof value !== "string") {
						errors.push(`El parámetro ${param.name} debe ser un texto`);
					} else if (param.regexPattern) {
						const regex = new RegExp(param.regexPattern);
						if (!regex.test(value)) {
							errors.push(
								`El parámetro ${param.name} no cumple con el formato requerido`
							);
						}
					}
					break;
				case "boolean":
					if (typeof value !== "boolean") {
						errors.push(
							`El parámetro ${param.name} debe ser verdadero o falso`
						);
					}
					break;
				case "date":
					if (!(value instanceof Date) && isNaN(Date.parse(value))) {
						errors.push(`El parámetro ${param.name} debe ser una fecha válida`);
					}
					break;
				case "enum":
					if (param.allowedValues) {
						const allowedValues = JSON.parse(param.allowedValues);
						if (!allowedValues.includes(value)) {
							errors.push(
								`El parámetro ${param.name} debe ser uno de: ${allowedValues.join(", ")}`
							);
						}
					}
					break;
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Ejecuta el cálculo basado en la plantilla y los parámetros proporcionados
	 */
	executeCalculation(
		template: CalculationTemplate,
		inputValues: Record<string, any>
	): CalculationResponse {
		const startTime = Date.now();
		const results: Record<string, any> = {};
		let wasSuccessful = true;
		let errorMessage: string | undefined;

		try {
			// Organizar parámetros por su scope
			const inputParams =
				template.parameters?.filter((p) => p.scope === ParameterScope.INPUT) ||
				[];
			const internalParams =
				template.parameters?.filter(
					(p) => p.scope === ParameterScope.INTERNAL
				) || [];
			const outputParams =
				template.parameters?.filter((p) => p.scope === ParameterScope.OUTPUT) ||
				[];

			// Validar parámetros de entrada
			const validation = this.validateInputParameters(inputParams, inputValues);
			if (!validation.isValid) {
				throw new CalculationError(
					"Errores de validación: " + validation.errors.join("; ")
				);
			}

			// Crear contexto de ejecución con los valores de entrada
			const context: Record<string, any> = {...inputValues};

			// Calcular parámetros internos (en orden de dependencia)
			for (const param of internalParams) {
				if (param.formula) {
					// Evaluar la fórmula en el contexto actual
					try {
						// Usar Function para evaluar la fórmula en el contexto seguro
						// eslint-disable-next-line no-new-func
						const calculate = new Function(
							...Object.keys(context),
							`return ${param.formula}`
						);
						context[param.name] = calculate(...Object.values(context));
					} catch (err) {
						throw new CalculationError(
							`Error al calcular parámetro interno ${param.name}: ${err.message}`
						);
					}
				}
			}

			// Ejecutar la fórmula principal del cálculo
			try {
				// eslint-disable-next-line no-new-func
				const mainCalculation = new Function(
					...Object.keys(context),
					`return ${template.formula}`
				);
				const mainResult = mainCalculation(...Object.values(context));

				// Si la fórmula devuelve un objeto, incorporarlo a los resultados
				if (typeof mainResult === "object" && mainResult !== null) {
					Object.assign(results, mainResult);
				} else {
					// Si no es un objeto, guardarlo como resultado principal
					results.resultado = mainResult;
				}
			} catch (err) {
				throw new CalculationError(
					`Error al ejecutar cálculo principal: ${err.message}`
				);
			}

			// Calcular parámetros de salida específicos
			for (const param of outputParams) {
				if (param.formula) {
					try {
						// eslint-disable-next-line no-new-func
						const calculate = new Function(
							...Object.keys(context),
							...Object.keys(results),
							`return ${param.formula}`
						);
						results[param.name] = calculate(
							...Object.values(context),
							...Object.values(results)
						);
					} catch (err) {
						throw new CalculationError(
							`Error al calcular parámetro de salida ${param.name}: ${err.message}`
						);
					}
				}
			}
		} catch (error) {
			wasSuccessful = false;
			errorMessage = error.message;
			console.error(`Error en cálculo (${template.id}):`, error);
		}

		const executionTimeMs = Date.now() - startTime;

		return {
			id: crypto.randomUUID(), // Temporal hasta guardarlo en BD
			templateId: template.id,
			templateName: template.name,
			templateVersion: template.version,
			results,
			executionTimeMs,
			wasSuccessful,
			errorMessage,
			timestamp: new Date(),
		};
	}

	/**
	 * Genera una vista previa del cálculo con valores de ejemplo
	 */
	generatePreview(template: CalculationTemplate): Record<string, any> {
		if (!template.parameters) {
			return {error: "La plantilla no tiene parámetros definidos"};
		}

		// Generar valores de ejemplo para los parámetros de entrada
		const sampleInputs: Record<string, any> = {};
		const inputParams = template.parameters.filter(
			(p) => p.scope === ParameterScope.INPUT
		);

		for (const param of inputParams) {
			// Usar valor por defecto si existe
			if (param.defaultValue !== undefined) {
				try {
					sampleInputs[param.name] = JSON.parse(param.defaultValue);
					continue;
				} catch {
					// Si no se puede parsear como JSON, usarlo como string
					sampleInputs[param.name] = param.defaultValue;
					continue;
				}
			}

			// Si no hay valor por defecto, generar uno según el tipo
			switch (param.dataType) {
				case "number":
					if (param.minValue !== undefined && param.maxValue !== undefined) {
						sampleInputs[param.name] = (param.minValue + param.maxValue) / 2;
					} else if (param.minValue !== undefined) {
						sampleInputs[param.name] = param.minValue + 1;
					} else if (param.maxValue !== undefined) {
						sampleInputs[param.name] = param.maxValue - 1;
					} else {
						sampleInputs[param.name] = 10; // Valor arbitrario
					}
					break;
				case "string":
					sampleInputs[param.name] = `Ejemplo ${param.name}`;
					break;
				case "boolean":
					sampleInputs[param.name] = true;
					break;
				case "date":
					sampleInputs[param.name] = new Date();
					break;
				case "enum":
					if (param.allowedValues) {
						try {
							const values = JSON.parse(param.allowedValues);
							sampleInputs[param.name] = values[0]; // Primer valor
						} catch {
							sampleInputs[param.name] = "ejemplo_enum";
						}
					} else {
						sampleInputs[param.name] = "ejemplo_enum";
					}
					break;
				case "object":
					sampleInputs[param.name] = {ejemplo: "valor"};
					break;
				case "array":
					sampleInputs[param.name] = [1, 2, 3];
					break;
			}
		}

		try {
			// Ejecutar el cálculo con los valores de ejemplo
			const previewResult = this.executeCalculation(template, sampleInputs);

			return {
				sampleInputs,
				results: previewResult.results,
				wasSuccessful: previewResult.wasSuccessful,
				errorMessage: previewResult.errorMessage,
			};
		} catch (error) {
			return {
				sampleInputs,
				error: `Error al generar vista previa: ${error.message}`,
			};
		}
	}
}
