// src/infrastructure/services/accounting/AccountingServiceFactory.ts
import {
	AccountingService,
	AccountingServiceConfig,
} from "../../../domain/services/AccountingService";

export class AccountingServiceFactory {
	static createService(
		system: string,
		config: AccountingServiceConfig
	): AccountingService {
		// Por ahora solo tenemos un placeholder ya que la implementación real vendrá después
		throw new Error(
			"La integración con el sistema de facturación está en desarrollo. Estará disponible próximamente."
		);
	}

	static getSupportedSystems(): string[] {
		return ["facturacionEcuador (próximamente)"];
	}
}
