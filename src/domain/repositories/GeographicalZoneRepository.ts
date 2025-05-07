// src/domain/repositories/GeographicalZoneRepository.ts
import {
	GeographicalZone,
	CreateGeographicalZoneDTO,
	UpdateGeographicalZoneDTO,
	SeismicZoneType,
} from "../models/calculation/GeographicalZone";

export interface GeographicalZoneRepository {
	findById(id: string): Promise<GeographicalZone | null>;
	findByName(name: string): Promise<GeographicalZone | null>;
	findAll(filters?: {
		isProvince?: boolean;
		parentZoneId?: string;
		seismicZone?: SeismicZoneType;
		searchTerm?: string;
	}): Promise<GeographicalZone[]>;
	findProvinces(): Promise<GeographicalZone[]>;
	findCitiesByProvince(provinceId: string): Promise<GeographicalZone[]>;
	create(zone: CreateGeographicalZoneDTO): Promise<GeographicalZone>;
	update(
		id: string,
		zoneData: UpdateGeographicalZoneDTO
	): Promise<GeographicalZone | null>;
	delete(id: string): Promise<boolean>;
}
