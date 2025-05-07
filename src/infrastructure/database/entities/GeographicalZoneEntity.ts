import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";

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

@Entity("geographical_zones")
export class GeographicalZoneEntity {
	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column()
	name: string; // Nombre de la provincia o ciudad

	@Column({type: "text", nullable: true})
	description: string;

	@Column({
		type: "enum",
		enum: SeismicZoneType,
	})
	seismicZone: SeismicZoneType;

	@Column({name: "seismic_factor", type: "decimal", precision: 5, scale: 3})
	seismicFactor: number; // Factor Z según NEC

	@Column({name: "is_province", default: true})
	isProvince: boolean; // Si es una provincia o una ciudad

	@Column({name: "parent_zone_id", nullable: true})
	parentZoneId: string; // Si es una ciudad, referencia a la provincia

	@Column({
		name: "default_soil_type",
		type: "enum",
		enum: SoilType,
		nullable: true,
	})
	defaultSoilType: SoilType; // Tipo de suelo predominante

	@Column({name: "elevation", type: "int", nullable: true})
	elevation: number; // Elevación promedio en metros sobre el nivel del mar

	@Column({name: "climate_zone", nullable: true})
	climateZone: string; // Zona climática para cálculos térmicos

	@Column({
		name: "wind_speed",
		type: "decimal",
		precision: 5,
		scale: 2,
		nullable: true,
	})
	windSpeed: number; // Velocidad de viento de diseño en km/h

	@Column({
		name: "rainfall_intensity",
		type: "decimal",
		precision: 5,
		scale: 2,
		nullable: true,
	})
	rainfallIntensity: number; // Intensidad de lluvia de diseño en mm/h

	@Column({
		name: "snow_load",
		type: "decimal",
		precision: 5,
		scale: 2,
		nullable: true,
	})
	snowLoad: number; // Carga de nieve de diseño en kg/m²

	@Column({name: "location_coordinates", type: "json", nullable: true})
	locationCoordinates: {
		latitude: number;
		longitude: number;
	}; // Coordenadas geográficas centrales

	@Column({name: "nec_reference", nullable: true})
	necReference: string; // Referencia específica a la sección de la NEC

	@CreateDateColumn({name: "created_at"})
	createdAt: Date;

	@UpdateDateColumn({name: "updated_at"})
	updatedAt: Date;
}
