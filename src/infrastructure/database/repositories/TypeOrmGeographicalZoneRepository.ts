// src/infrastructure/database/repositories/TypeOrmGeographicalZoneRepository.ts
import {Repository} from "typeorm";
import {AppDataSource} from "../data-source";
import {GeographicalZoneRepository} from "@domain/repositories/GeographicalZoneRepository";
import {
	GeographicalZone,
	CreateGeographicalZoneDTO,
	UpdateGeographicalZoneDTO,
	SeismicZoneType,
} from "@domain/models/calculation/GeographicalZone";
import {GeographicalZoneEntity} from "../entities/GeographicalZoneEntity";

export class TypeOrmGeographicalZoneRepository
	implements GeographicalZoneRepository
{
	private repository: Repository<GeographicalZoneEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(GeographicalZoneEntity);
	}

	async findById(id: string): Promise<GeographicalZone | null> {
		const zone = await this.repository.findOne({
			where: {id},
		});

		return zone ? this.toDomainModel(zone) : null;
	}

	async findByName(name: string): Promise<GeographicalZone | null> {
		const zone = await this.repository.findOne({
			where: {name},
		});

		return zone ? this.toDomainModel(zone) : null;
	}

	async findAll(filters?: {
		isProvince?: boolean;
		parentZoneId?: string;
		seismicZone?: SeismicZoneType;
		searchTerm?: string;
	}): Promise<GeographicalZone[]> {
		let queryBuilder = this.repository.createQueryBuilder("zone");

		// Aplicar filtros
		if (filters) {
			if (filters.isProvince !== undefined) {
				queryBuilder = queryBuilder.andWhere("zone.is_province = :isProvince", {
					isProvince: filters.isProvince,
				});
			}

			if (filters.parentZoneId) {
				queryBuilder = queryBuilder.andWhere(
					"zone.parent_zone_id = :parentId",
					{parentId: filters.parentZoneId}
				);
			}

			if (filters.seismicZone) {
				queryBuilder = queryBuilder.andWhere(
					"zone.seismicZone = :seismicZone",
					{seismicZone: filters.seismicZone}
				);
			}

			if (filters.searchTerm) {
				queryBuilder = queryBuilder.andWhere(
					"zone.name LIKE :term OR zone.description LIKE :term",
					{term: `%${filters.searchTerm}%`}
				);
			}
		}

		// Ordenar por nombre
		queryBuilder = queryBuilder.orderBy("zone.name", "ASC");

		// Ejecutar consulta
		const zoneEntities = await queryBuilder.getMany();

		// Convertir a modelos de dominio
		return zoneEntities.map((entity) => this.toDomainModel(entity));
	}

	async findProvinces(): Promise<GeographicalZone[]> {
		const provinces = await this.repository.find({
			where: {isProvince: true},
			order: {name: "ASC"},
		});

		return provinces.map((province) => this.toDomainModel(province));
	}

	async findCitiesByProvince(provinceId: string): Promise<GeographicalZone[]> {
		const cities = await this.repository.find({
			where: {
				isProvince: false,
				parentZoneId: provinceId,
			},
			order: {name: "ASC"},
		});

		return cities.map((city) => this.toDomainModel(city));
	}

	async create(zoneData: CreateGeographicalZoneDTO): Promise<GeographicalZone> {
		const zoneEntity = this.toEntity(zoneData);
		const savedZone = await this.repository.save(zoneEntity);
		return this.toDomainModel(savedZone);
	}

	async update(
		id: string,
		zoneData: UpdateGeographicalZoneDTO
	): Promise<GeographicalZone | null> {
		const zone = await this.repository.findOne({where: {id}});

		if (!zone) return null;

		// Actualizar campos
		Object.assign(zone, zoneData);

		const updatedZone = await this.repository.save(zone);
		return this.toDomainModel(updatedZone);
	}

	async delete(id: string): Promise<boolean> {
		// Verificar si hay ciudades que dependen de esta zona (si es provincia)
		const hasDependentCities = await this.repository.count({
			where: {parentZoneId: id},
		});

		if (hasDependentCities > 0) {
			throw new Error(
				"No se puede eliminar una provincia que tiene ciudades asociadas"
			);
		}

		const result = await this.repository.delete(id);
		return result.affected !== 0;
	}

	// Métodos de conversión de entidad a dominio y viceversa
	private toDomainModel(entity: GeographicalZoneEntity): GeographicalZone {
		return {
			id: entity.id,
			name: entity.name,
			description: entity.description,
			seismicZone: entity.seismicZone,
			seismicFactor: entity.seismicFactor,
			isProvince: entity.isProvince,
			parentZoneId: entity.parentZoneId,
			defaultSoilType: entity.defaultSoilType,
			elevation: entity.elevation,
			climateZone: entity.climateZone,
			windSpeed: entity.windSpeed,
			rainfallIntensity: entity.rainfallIntensity,
			snowLoad: entity.snowLoad,
			locationCoordinates: entity.locationCoordinates,
			necReference: entity.necReference,
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
		};
	}

	private toEntity(model: CreateGeographicalZoneDTO): GeographicalZoneEntity {
		const entity = new GeographicalZoneEntity();

		// Copiar campos
		entity.name = model.name;
		entity.description = model.description;
		entity.seismicZone = model.seismicZone;
		entity.seismicFactor = model.seismicFactor;
		entity.isProvince = model.isProvince;
		entity.parentZoneId = model.parentZoneId;
		entity.defaultSoilType = model.defaultSoilType;
		entity.elevation = model.elevation;
		entity.climateZone = model.climateZone;
		entity.windSpeed = model.windSpeed;
		entity.rainfallIntensity = model.rainfallIntensity;
		entity.snowLoad = model.snowLoad;
		entity.locationCoordinates = model.locationCoordinates;
		entity.necReference = model.necReference;

		return entity;
	}
}
