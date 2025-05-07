// src/infrastructure/webserver/utils/errorHandler.ts
/**
 * Función para manejar errores de forma segura en TypeScript
 * Proporciona un tipado seguro para el mensaje de error y propiedades adicionales
 */
export interface TypedError {
	name?: string;
	message: string;
	errors?: string[] | Record<string, string>[];
	code?: string | number;
	stack?: string;
}

/**
 * Convierte un error de tipo unknown a un objeto tipado
 */
export function handleError(error: unknown): TypedError {
	// Si ya es un Error de JS, extraer sus propiedades
	if (error instanceof Error) {
		const typedError: TypedError = {
			name: error.name,
			message: error.message,
			stack: error.stack,
		};

		// Extraer propiedades adicionales específicas si existen
		const anyError = error as any;
		if (anyError.errors) {
			typedError.errors = anyError.errors;
		}

		if (anyError.code) {
			typedError.code = anyError.code;
		}

		return typedError;
	}

	// Si es un string, usarlo como mensaje
	if (typeof error === "string") {
		return {
			message: error,
		};
	}

	// Si es un objeto, intentar extraer un mensaje
	if (typeof error === "object" && error !== null) {
		const anyError = error as any;

		return {
			message: anyError.message || "Error desconocido",
			...(anyError.errors && {errors: anyError.errors}),
			...(anyError.code && {code: anyError.code}),
			...(anyError.name && {name: anyError.name}),
			...(anyError.stack && {stack: anyError.stack}),
		};
	}

	// En cualquier otro caso, devolver un mensaje genérico
	return {
		message: "Error desconocido",
	};
}
