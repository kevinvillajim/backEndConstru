// src/domain/models/calculation/GeographicalZone.ts
export enum SeismicZoneType {
	ZONE_I = "zone_i", // Zona de menor peligro sísmico
	ZONE_II = "zone_ii",
	ZONE_III = "zone_iii",
	ZONE_IV = "zone_iv",
	ZONE_V = "zone_v", // Zona de mayor peligro sísmico
}

export enum SoilType {
	TYPE_A = "type_a", // Roca competente
	TYPE_B = "type_b", // Roca de rigidez media
	TYPE_C = "type_c", // Suelos muy densos o roca blanda
	TYPE_D = "type_d", // Suelos rígidos
	TYPE_E = "type_e", // Suelos blandos
	TYPE_F = "type_f", // Suelos con condiciones especiales
}

export type GeographicalZone = {
	id: string;
	name: string; // Nombre de la provincia o ciudad
	description?: string;
	seismicZone: SeismicZoneType;
	seismicFactor: number; // Factor Z según NEC
	isProvince: boolean; // Si es una provincia o una ciudad
	parentZoneId?: string; // Si es una ciudad, referencia a la provincia
	defaultSoilType?: SoilType; // Tipo de suelo predominante
	elevation?: number; // Elevación promedio en metros sobre el nivel del mar
	climateZone?: string; // Zona climática para cálculos térmicos
	windSpeed?: number; // Velocidad de viento de diseño en km/h
	rainfallIntensity?: number; // Intensidad de lluvia de diseño en mm/h
	snowLoad?: number; // Carga de nieve de diseño en kg/m²
	locationCoordinates?: {
		latitude: number;
		longitude: number;
	}; // Coordenadas geográficas centrales
	necReference?: string; // Referencia específica a la sección de la NEC
	createdAt: Date;
	updatedAt: Date;
};

export type CreateGeographicalZoneDTO = Omit<
	GeographicalZone,
	"id" | "createdAt" | "updatedAt"
>;

export type UpdateGeographicalZoneDTO = Partial<
	Omit<GeographicalZone, "id" | "createdAt" | "updatedAt">
>;
