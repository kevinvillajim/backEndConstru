// src/domain/services/TemplateValidationService.ts
import {CreateCalculationTemplateDTO} from "../models/calculation/CalculationTemplate";
import {
	CreateCalculationParameterDTO,
	ParameterScope,
	ParameterDataType,
} from "../models/calculation/CalculationParameter";

export class FormulaError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FormulaError";
	}
}

export class TemplateValidationService {
	/**
	 * Valida una fórmula para asegurarse de que es sintácticamente correcta
	 * y solo usa parámetros definidos en la plantilla
	 */
	validateFormula(
		formula: string,
		parameterNames: string[]
	): {isValid: boolean; error?: string} {
		// Verificar que la fórmula no está vacía
		if (!formula.trim()) {
			return {isValid: false, error: "La fórmula no puede estar vacía"};
		}

		try {
			// Extraer todos los posibles identificadores en la fórmula
			// Esta es una aproximación simple, podría mejorarse con un parser de JS completo
			const identifiersRegex = /[a-zA-Z_$][\w$]*/g;
			const identifiers = [...new Set(formula.match(identifiersRegex) || [])];

			// Filtrar identificadores que son palabras clave de JS o funciones matemáticas comunes
			const jsKeywords = [
				"if",
				"else",
				"return",
				"var",
				"let",
				"const",
				"function",
				"true",
				"false",
				"null",
				"undefined",
				"Math",
				"Number",
				"String",
				"Boolean",
				"Object",
				"Array",
				"Date",
				"parseInt",
				"parseFloat",
				"isNaN",
				"isFinite",
				"toString",
				"valueOf",
			];

			const mathMethods = [
				"abs",
				"acos",
				"acosh",
				"asin",
				"asinh",
				"atan",
				"atanh",
				"atan2",
				"ceil",
				"cbrt",
				"expm1",
				"clz32",
				"cos",
				"cosh",
				"exp",
				"floor",
				"fround",
				"hypot",
				"imul",
				"log",
				"log1p",
				"log2",
				"log10",
				"max",
				"min",
				"pow",
				"random",
				"round",
				"sign",
				"sin",
				"sinh",
				"sqrt",
				"tan",
				"tanh",
				"trunc",
				"E",
				"LN10",
				"LN2",
				"LOG10E",
				"LOG2E",
				"PI",
				"SQRT1_2",
				"SQRT2",
			];

			const allowedIdentifiers = [...jsKeywords, ...mathMethods];

			// Encontrar identificadores que no son permitidos ni son parámetros
			const unknownIdentifiers = identifiers.filter(
				(id) =>
					!allowedIdentifiers.includes(id) &&
					!parameterNames.includes(id) &&
					// Permitir acceso a propiedades de Math
					!id.startsWith("Math.")
			);

			if (unknownIdentifiers.length > 0) {
				return {
					isValid: false,
					error: `La fórmula contiene identificadores desconocidos: ${unknownIdentifiers.join(", ")}`,
				};
			}

			// Intentar compilar la fórmula para verificar su sintaxis
			// eslint-disable-next-line no-new-func
			new Function(...parameterNames, `return ${formula}`);

			return {isValid: true};
		} catch (error) {
            return {
            	isValid: false,
            	error: `Error de sintaxis: ${(error as Error).message}`,
            };		}
	}

	/**
	 * Valida una plantilla completa, incluyendo sus parámetros y fórmulas
	 */
	validateTemplate(template: CreateCalculationTemplateDTO): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Validar campos básicos
		if (!template.name.trim()) {
			errors.push("El nombre de la plantilla es requerido");
		}

		if (!template.description.trim()) {
			errors.push("La descripción de la plantilla es requerida");
		}

		// Validar que hay al menos un parámetro de entrada y uno de salida
		const inputParams = template.parameters.filter(
			(p) => p.scope === ParameterScope.INPUT
		);
		const outputParams = template.parameters.filter(
			(p) => p.scope === ParameterScope.OUTPUT
		);

		if (inputParams.length === 0) {
			errors.push("La plantilla debe tener al menos un parámetro de entrada");
		}

		if (outputParams.length === 0) {
			errors.push("La plantilla debe tener al menos un parámetro de salida");
		}

		// Validar nombres únicos para los parámetros
		const paramNames = template.parameters.map((p) => p.name);
		const uniqueParamNames = new Set(paramNames);

		if (uniqueParamNames.size !== paramNames.length) {
			errors.push("Los nombres de los parámetros deben ser únicos");
		}

		// Validar cada parámetro
		template.parameters.forEach((param) => {
			const paramErrors = this.validateParameter(param);
			errors.push(...paramErrors);
		});

		// Validar la fórmula principal
		const formulaValidation = this.validateFormula(
			template.formula,
			paramNames
		);
		if (!formulaValidation.isValid && formulaValidation.error) {
			errors.push(`Error en fórmula principal: ${formulaValidation.error}`);
		}

		// Validar fórmulas de parámetros internos y de salida
		const nonInputParams = template.parameters.filter(
			(p) => p.scope !== ParameterScope.INPUT
		);

		for (const param of nonInputParams) {
			if (param.formula) {
				const paramFormulaValidation = this.validateFormula(
					param.formula,
					paramNames
				);
				if (!paramFormulaValidation.isValid && paramFormulaValidation.error) {
					errors.push(
						`Error en fórmula del parámetro ${param.name}: ${paramFormulaValidation.error}`
					);
				}
			} else if (param.scope === ParameterScope.OUTPUT) {
				errors.push(
					`El parámetro de salida ${param.name} debe tener una fórmula definida`
				);
			}
		}

		// Validar que no hay dependencias circulares
		try {
			this.checkCircularDependencies(template.parameters);
		} catch (error) {
			errors.push((error as Error).message);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Valida un parámetro individual
	 */
	private validateParameter(param: CreateCalculationParameterDTO): string[] {
		const errors: string[] = [];

		if (!param.name.trim()) {
			errors.push("El nombre del parámetro es requerido");
		}

		if (!param.description.trim()) {
			errors.push(`El parámetro ${param.name} debe tener una descripción`);
		}

		// Validaciones específicas por tipo de datos
		switch (param.dataType) {
			case ParameterDataType.NUMBER:
				if (param.minValue !== undefined && param.maxValue !== undefined) {
					if (param.minValue >= param.maxValue) {
						errors.push(
							`El valor mínimo debe ser menor que el valor máximo para ${param.name}`
						);
					}
				}
				break;
			case ParameterDataType.ENUM:
				if (!param.allowedValues) {
					errors.push(
						`El parámetro enum ${param.name} debe especificar valores permitidos`
					);
				} else {
					try {
						const values = JSON.parse(param.allowedValues);
						if (!Array.isArray(values) || values.length === 0) {
							errors.push(
								`Valores permitidos inválidos para ${param.name}: debe ser un array no vacío`
							);
						}
					} catch {
						errors.push(
							`Valores permitidos inválidos para ${param.name}: debe ser un JSON válido`
						);
					}
				}
				break;
			case ParameterDataType.STRING:
				if (param.regexPattern) {
					try {
						// Validar que el regex es válido
						new RegExp(param.regexPattern);
					} catch {
						errors.push(`Patrón regex inválido para ${param.name}`);
					}
				}
				break;
		}

		return errors;
	}

	/**
	 * Verifica que no haya dependencias circulares entre los parámetros
	 */
	private checkCircularDependencies(
		parameters: CreateCalculationParameterDTO[]
	): void {
		// Construir grafo de dependencias
		const dependencyGraph: Record<string, string[]> = {};

		for (const param of parameters) {
			dependencyGraph[param.name] = [];

			if (param.formula) {
				// Extraer identificadores de la fórmula (aproximación simple)
				const identifiersRegex = /[a-zA-Z_$][\w$]*/g;
				const identifiers = [
					...new Set(param.formula.match(identifiersRegex) || []),
				];

				// Filtrar solo los nombres de parámetros
				const paramNames = parameters.map((p) => p.name);
				const dependencies = identifiers.filter((id) =>
					paramNames.includes(id)
				);

				dependencyGraph[param.name] = dependencies;
			}
		}

		// Detectar ciclos usando DFS
		const visited = new Set<string>();
		const inStack = new Set<string>();

		function dfs(node: string, path: string[] = []): void {
			if (inStack.has(node)) {
				const cycle = [...path.slice(path.indexOf(node)), node];
				throw new FormulaError(
					`Dependencia circular detectada: ${cycle.join(" -> ")}`
				);
			}

			if (visited.has(node)) return;

			visited.add(node);
			inStack.add(node);

			for (const neighbor of dependencyGraph[node]) {
				dfs(neighbor, [...path, node]);
			}

			inStack.delete(node);
		}

		// Iniciar DFS desde cada nodo no visitado
		for (const param of parameters) {
			if (!visited.has(param.name)) {
				dfs(param.name);
			}
		}
	}
}
