// src/domain/services/SriService.ts
export interface SriAuthorization {
	authorizationNumber: string;
	authorizationDate: Date;
	accessKey: string;
	electronicDocumentUrl?: string;
	status: "AUTHORIZED" | "REJECTED" | "PENDING";
	errorMessage?: string;
}

export interface SriServiceConfig {
	apiKey?: string;
	apiUrl?: string;
	username?: string;
	password?: string;
	companyId?: string;
	certificatePath?: string;
	certificatePassword?: string;
	testEnvironment?: boolean;
	[key: string]: any;
}

export interface SriService {
	/**
	 * Nombre del servicio
	 */
	readonly name: string;

	/**
	 * Verifica la conexión y credenciales
	 */
	testConnection(): Promise<boolean>;

	/**
	 * Genera una factura electrónica y obtiene autorización del SRI
	 */
	generateElectronicInvoice(invoiceId: string): Promise<SriAuthorization>;

	/**
	 * Verifica el estado de una factura electrónica
	 */
	checkInvoiceStatus(authorizationNumber: string): Promise<SriAuthorization>;

	/**
	 * Anula una factura electrónica
	 */
	voidInvoice(authorizationNumber: string, reason: string): Promise<boolean>;

	/**
	 * Obtiene el documento de una factura electrónica
	 */
	getElectronicInvoiceDocument(authorizationNumber: string): Promise<string>;
}
