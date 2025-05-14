// src/infrastructure/services/sri/SriTestAdapter.ts
import {
	SriService,
	SriAuthorization,
	SriServiceConfig,
} from "../../../domain/services/SriService";

/**
 * Adaptador de prueba para el servicio SRI
 * Esta es una implementación de placeholder para testeo hasta que el API real esté disponible
 */
export class SriTestAdapter implements SriService {
	private config: SriServiceConfig;

	constructor(config: SriServiceConfig) {
		this.config = config;
	}

	get name(): string {
		return "SRI Ambiente de Pruebas";
	}

	async testConnection(): Promise<boolean> {
		// Simulamos conexión exitosa
		return true;
	}

	async generateElectronicInvoice(
		invoiceId: string
	): Promise<SriAuthorization> {
		// Simulamos generar una factura electrónica
		const now = new Date();
		const authorizationNumber = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${Math.floor(
			Math.random() * 1000000000
		)
			.toString()
			.padStart(9, "0")}`;
		const accessKey = `${authorizationNumber}${Math.floor(Math.random() * 10000)
			.toString()
			.padStart(4, "0")}`;

		return {
			authorizationNumber,
			authorizationDate: now,
			accessKey,
			electronicDocumentUrl: `https://sri-test.gob.ec/documents/${accessKey}.pdf`,
			status: "AUTHORIZED",
		};
	}

	async checkInvoiceStatus(
		authorizationNumber: string
	): Promise<SriAuthorization> {
		// Simulamos verificar estado
		return {
			authorizationNumber,
			authorizationDate: new Date(),
			accessKey: `${authorizationNumber}1234`,
			electronicDocumentUrl: `https://sri-test.gob.ec/documents/${authorizationNumber}.pdf`,
			status: "AUTHORIZED",
		};
	}

	async voidInvoice(
		authorizationNumber: string,
		reason: string
	): Promise<boolean> {
		// Simulamos anular factura
		return true;
	}

	async getElectronicInvoiceDocument(
		authorizationNumber: string
	): Promise<string> {
		// Simulamos obtener documento XML
		return `<?xml version="1.0" encoding="UTF-8"?>
      <factura>
        <infoTributaria>
          <ambiente>1</ambiente>
          <tipoEmision>1</tipoEmision>
          <claveAcceso>${authorizationNumber}</claveAcceso>
        </infoTributaria>
        <infoFactura>
          <fechaEmision>${new Date().toISOString().split("T")[0]}</fechaEmision>
          <obligadoContabilidad>SI</obligadoContabilidad>
          <tipoIdentificacionComprador>04</tipoIdentificacionComprador>
          <razonSocialComprador>CLIENTE EJEMPLO</razonSocialComprador>
          <identificacionComprador>0992327685001</identificacionComprador>
          <totalSinImpuestos>100.00</totalSinImpuestos>
          <totalDescuento>0.00</totalDescuento>
        </infoFactura>
      </factura>`;
	}
}
