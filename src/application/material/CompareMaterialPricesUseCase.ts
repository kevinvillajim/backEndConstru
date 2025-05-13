// src/application/material/CompareMaterialPricesUseCase.ts
// Corregir la clase con estos cambios:

import {MaterialRepository} from "../../domain/repositories/MaterialRepository";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {UserRole} from "../../domain/models/user/User";

export interface PriceComparisonResult {
	materialId: string;
	materialName: string;
	providers: {
		providerId: string;
		providerName: string;
		price: number;
		wholesalePrice?: number;
		distance?: number;
		freeShipping: boolean;
		estimatedDelivery: string;
		inStock: boolean;
		stockLevel: number;
	}[];
	bestOption?: {
		providerId: string;
		reason: string;
	};
}

export class CompareMaterialPricesUseCase {
	constructor(
		private materialRepository: MaterialRepository,
		private userRepository: UserRepository
	) {}

	/**
	 * Compara precios de un material entre diferentes proveedores
	 * Solo accesible para administradores
	 */
	async execute(
		materialId: string,
		userId: string,
		projectLocation?: {lat: number; lng: number}
	): Promise<PriceComparisonResult> {
		// 1. Verificar que el usuario es administrador
		const user = await this.userRepository.findById(userId);

		if (!user || user.role !== UserRole.ADMIN) {
			throw new Error(
				"Solo los administradores pueden acceder a la comparación de precios"
			);
		}

		// 2. Obtener el material base
		const material = await this.materialRepository.findById(materialId);

		if (!material) {
			throw new Error(`Material no encontrado: ${materialId}`);
		}

		// 3. Buscar materiales similares de otros proveedores
		const similarMaterials = await this.materialRepository.findSimilar(
			material.name,
			material.categoryId
		);

		// 4. Preparar resultados de comparación
		const providerResults = await Promise.all(
			similarMaterials.map(async (similarMaterial) => {
				const provider = await this.userRepository.findById(
					similarMaterial.sellerId
				);

				// Calcular distancia si tenemos ubicación del proyecto
				let distance = null;
				if (projectLocation && provider) {
					// Asumiendo que el usuario tiene una dirección que podemos usar para calcular distancia
					// En una implementación real, podríamos tener un campo address con lat/lng
					distance = 0; // Valor por defecto
				}

				return {
					providerId: similarMaterial.sellerId,
					providerName: provider?.email || "Proveedor desconocido", // Usar email en lugar de name
					price: similarMaterial.price,
					wholesalePrice: similarMaterial.wholesalePrice,
					distance: distance,
					freeShipping: false, // Valor por defecto, en una implementación real esto vendría de las preferencias del proveedor
					estimatedDelivery: this.calculateDeliveryTime(distance),
					inStock: similarMaterial.stock > 0,
					stockLevel: similarMaterial.stock,
				};
			})
		);

		// 5. Determinar la mejor opción usando un algoritmo de puntuación
		const bestOption = this.determineBestOption(
			providerResults,
			projectLocation
		);

		return {
			materialId: material.id,
			materialName: material.name,
			providers: providerResults,
			bestOption: bestOption,
		};
	}

	/**
	 * Calcula la distancia entre dos puntos (simplificado)
	 */
	private calculateDistance(
		point1: {lat: number; lng: number},
		point2: {lat: number; lng: number}
	): number {
		// Implementación simplificada de la fórmula de Haversine
		// En producción, usar una biblioteca de geolocalización
		return (
			Math.sqrt(
				Math.pow(point1.lat - point2.lat, 2) +
					Math.pow(point1.lng - point2.lng, 2)
			) * 111
		); // Aproximación en km
	}

	/**
	 * Calcula el tiempo estimado de entrega basado en la distancia
	 */
	private calculateDeliveryTime(distance: number | null): string {
		if (!distance) return "1-3 días"; // Default

		if (distance < 10) return "Mismo día";
		if (distance < 50) return "1 día";
		if (distance < 200) return "2-3 días";
		return "4-7 días";
	}

	/**
	 * Determina la mejor opción basada en múltiples factores:
	 * - Precio
	 * - Distancia
	 * - Disponibilidad
	 * - Nivel de inventario
	 */
	private determineBestOption(
		providers: any[],
		projectLocation?: {lat: number; lng: number}
	): {providerId: string; reason: string} | undefined {
		if (providers.length === 0) return undefined;

		// Sistema de puntuación
		const scoredProviders = providers.map((provider) => {
			let score = 0;

			// Puntos por precio (inverso - menos es mejor)
			const minPrice = Math.min(...providers.map((p) => p.price));
			score += (minPrice / provider.price) * 60; // 60% de peso en precio

			// Puntos por envío gratuito
			if (provider.freeShipping) score += 15; // 15% de peso

			// Puntos por disponibilidad
			if (provider.inStock) {
				score += 15; // 15% de peso
				score += Math.min(provider.stockLevel / 20, 1) * 10; // 10% adicional por alto stock
			}

			// Puntos por distancia (si aplica)
			if (projectLocation && provider.distance !== null) {
				const maxDistance = Math.max(
					...providers
						.filter((p) => p.distance !== null)
						.map((p) => p.distance || 0)
				);
				if (maxDistance > 0) {
					score +=
						((maxDistance - (provider.distance || 0)) / maxDistance) * 10; // 10% por cercanía
				}
			}

			return {...provider, score};
		});

		// Ordenar por puntuación
		scoredProviders.sort((a, b) => b.score - a.score);

		// Determinar la razón principal
		const best = scoredProviders[0];
		let reason = "";

		if (best.price === Math.min(...providers.map((p) => p.price))) {
			reason = "Mejor precio";
		} else if (best.freeShipping && !providers.every((p) => p.freeShipping)) {
			reason = "Envío gratuito";
		} else if (
			projectLocation &&
			best.distance ===
				Math.min(
					...providers
						.filter((p) => p.distance !== null)
						.map((p) => p.distance || Infinity)
				)
		) {
			reason = "Más cercano al proyecto";
		} else {
			reason = "Mejor combinación de factores";
		}

		return {
			providerId: best.providerId,
			reason,
		};
	}
}
