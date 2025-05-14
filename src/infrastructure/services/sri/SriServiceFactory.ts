// src/infrastructure/services/sri/SriServiceFactory.ts
import {
	SriService,
	SriServiceConfig,
} from "../../../domain/services/SriService";

export class SriServiceFactory {
	static createService(config: SriServiceConfig): SriService {
		// Como el API real está en desarrollo, retornamos un mensaje de placeholder
		throw new Error(
			"La integración con el SRI está en desarrollo. Estará disponible próximamente."
		);
	}

	static getSupportedEnvironments(): string[] {
		return ["Ambiente de Pruebas", "Ambiente de Producción (próximamente)"];
	}
}
