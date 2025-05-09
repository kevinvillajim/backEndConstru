// src/application/project/GenerateProjectScheduleUseCase.ts
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {ProjectBudgetRepository} from "../../domain/repositories/ProjectBudgetRepository";
import {ProjectEntity} from "../../infrastructure/database/entities/ProjectEntity";
import {PhaseEntity} from "../../infrastructure/database/entities/PhaseEntity";
import {TaskEntity} from "../../infrastructure/database/entities/TaskEntity";
import {v4 as uuidv4} from "uuid";

export class GenerateProjectScheduleUseCase {
	constructor(
		private projectRepository: ProjectRepository,
		private phaseRepository: PhaseRepository,
		private taskRepository: TaskRepository,
		private projectBudgetRepository: ProjectBudgetRepository
	) {}

	/**
	 * Genera un cronograma de proyecto basado en tipo de proyecto, área y presupuesto
	 */
	async execute(
		projectId: string,
		userId: string
	): Promise<{
		projectId: string;
		phases: number;
		tasks: number;
		startDate: Date;
		endDate: Date;
	}> {
		// 1. Obtener información del proyecto
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw new Error(`Proyecto no encontrado: ${projectId}`);
		}

		// 2. Verificar que el proyecto pertenezca al usuario
		if (project.userId !== userId) {
			throw new Error("No tienes permiso para modificar este proyecto");
		}

		// 3. Validar que el proyecto tenga los datos necesarios
		if (!project.type) {
			throw new Error("El proyecto debe tener un tipo definido");
		}

		if (!project.totalArea && !project.constructionArea) {
			throw new Error("El proyecto debe tener un área definida");
		}

		// 4. Buscar si ya existe un presupuesto para obtener montos
		let budget = null;
		const budgets = await this.projectBudgetRepository.findByProject(projectId);
		if (budgets && budgets.length > 0) {
			// Usar el presupuesto más reciente
			budget = budgets.sort(
				(a, b) =>
					b.version - a.version ||
					(b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
			)[0];
		}

		// 5. Generar estructura de fases según tipo de proyecto
		const startDate = project.startDate || new Date();
		let endDate = project.estimatedCompletionDate || new Date();

		if (!project.estimatedCompletionDate) {
			// Estimar duración si no está definida
			const durationDays = this.estimateProjectDuration(
				project.type,
				project.constructionArea || project.totalArea || 0
			);
			endDate = new Date(startDate);
			endDate.setDate(endDate.getDate() + durationDays);
		}

		// 6. Generar fases y tareas según el tipo de proyecto
		const phaseTemplates = this.getPhaseTemplates(project.type);
		const createdPhases: PhaseEntity[] = [];
		const createdTasks: TaskEntity[] = [];

		// Distribuir fechas a lo largo del período del proyecto
		const totalDuration =
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		let currentDate = new Date(startDate);

		for (const [index, phaseTemplate] of phaseTemplates.entries()) {
			// Calcular duración de la fase como porcentaje del total
			const phaseDurationDays = Math.round(
				totalDuration * phaseTemplate.durationPercentage
			);

			// Crear la fase
			const phaseEndDate = new Date(currentDate);
			phaseEndDate.setDate(phaseEndDate.getDate() + phaseDurationDays);

			const phase = new PhaseEntity();
			phase.id = uuidv4();
			phase.name = phaseTemplate.name;
			phase.description = phaseTemplate.description;
			phase.startDate = new Date(currentDate);
			phase.endDate = phaseEndDate;
			phase.completionPercentage = 0;
			phase.projectId = projectId;

			createdPhases.push(phase);

			// Generar tareas para esta fase
			for (const taskTemplate of phaseTemplate.tasks) {
				const taskStartDate = new Date(currentDate);

				// Ajustar fecha de inicio si la tarea no comienza al inicio de la fase
				if (taskTemplate.startOffsetDays > 0) {
					taskStartDate.setDate(
						taskStartDate.getDate() + taskTemplate.startOffsetDays
					);
				}

				// Calcular fecha de fin de tarea
				const taskEndDate = new Date(taskStartDate);
				taskEndDate.setDate(taskEndDate.getDate() + taskTemplate.durationDays);

				// Asegurarse que la tarea no termine después de la fase
				if (taskEndDate > phaseEndDate) {
					taskEndDate.setTime(phaseEndDate.getTime());
				}

				const task = new TaskEntity();
				task.id = uuidv4();
				task.name = taskTemplate.name;
				task.description = taskTemplate.description;
				task.status = "pending";
				task.startDate = taskStartDate;
				task.endDate = taskEndDate;
				task.phaseId = phase.id;

				createdTasks.push(task);
			}

			// Actualizar fecha actual para la siguiente fase
			currentDate = phaseEndDate;
		}

		// 7. Guardar las fases y tareas en la base de datos
		const savedPhases = await this.phaseRepository.createMany(createdPhases);
		const savedTasks = await this.taskRepository.createMany(createdTasks);

		// 8. Actualizar el proyecto con las fechas calculadas
		await this.projectRepository.update(projectId, {
			estimatedCompletionDate: endDate,
		});

		return {
			projectId,
			phases: savedPhases.length,
			tasks: savedTasks.length,
			startDate,
			endDate,
		};
	}

	/**
	 * Estima la duración de un proyecto en días según su tipo y área
	 */
	private estimateProjectDuration(projectType: string, area: number): number {
		// Valores base de duración por tipo de proyecto (en días)
		const baseDuration: Record<string, number> = {
			residential: 120, // 4 meses para vivienda
			commercial: 180, // 6 meses para comercial
			industrial: 240, // 8 meses para industrial
			infrastructure: 300, // 10 meses para infraestructura
			remodeling: 90, // 3 meses para remodelación
			maintenance: 30, // 1 mes para mantenimiento
			other: 150, // 5 meses por defecto
		};

		// Factor de ajuste por área
		let areaFactor = 1.0;

		if (area < 100) {
			areaFactor = 0.7; // Proyectos pequeños son más rápidos
		} else if (area >= 100 && area < 300) {
			areaFactor = 1.0; // Base
		} else if (area >= 300 && area < 1000) {
			areaFactor = 1.3; // Proyectos medianos
		} else if (area >= 1000) {
			areaFactor = 1.8; // Proyectos grandes
		}

		// Duración estimada
		const duration = baseDuration[projectType] * areaFactor;

		return Math.round(duration);
	}

	/**
	 * Obtiene plantillas de fases y tareas según el tipo de proyecto
	 */
	private getPhaseTemplates(projectType: string): {
		name: string;
		description: string;
		durationPercentage: number;
		tasks: {
			name: string;
			description: string;
			startOffsetDays: number;
			durationDays: number;
		}[];
	}[] {
		// Plantillas por tipo de proyecto
		const templates: Record<string, any[]> = {
			residential: [
				{
					name: "Diseño y Planificación",
					description:
						"Fase de diseño arquitectónico, estructural y aprobación de planos",
					durationPercentage: 0.15,
					tasks: [
						{
							name: "Diseño arquitectónico",
							description: "Elaboración de planos arquitectónicos",
							startOffsetDays: 0,
							durationDays: 15,
						},
						{
							name: "Diseño estructural",
							description: "Cálculo y diseño de estructura",
							startOffsetDays: 10,
							durationDays: 10,
						},
						{
							name: "Aprobación municipal",
							description: "Trámites de aprobación municipal",
							startOffsetDays: 20,
							durationDays: 15,
						},
					],
				},
				{
					name: "Preliminares y Cimentación",
					description: "Trabajos de excavación y cimentación",
					durationPercentage: 0.2,
					tasks: [
						{
							name: "Limpieza del terreno",
							description: "Preparación y nivelación del terreno",
							startOffsetDays: 0,
							durationDays: 5,
						},
						{
							name: "Excavación",
							description: "Excavación para cimientos",
							startOffsetDays: 5,
							durationDays: 7,
						},
						{
							name: "Cimentación",
							description: "Construcción de cimientos y plintos",
							startOffsetDays: 12,
							durationDays: 15,
						},
					],
				},
				{
					name: "Estructura",
					description: "Construcción de columnas, vigas y losas",
					durationPercentage: 0.25,
					tasks: [
						{
							name: "Columnas planta baja",
							description: "Armado y fundición de columnas",
							startOffsetDays: 0,
							durationDays: 10,
						},
						{
							name: "Losa primer nivel",
							description: "Encofrado, armado y fundición de losa",
							startOffsetDays: 10,
							durationDays: 15,
						},
						{
							name: "Columnas y vigas superiores",
							description: "Armado y fundición de estructura superior",
							startOffsetDays: 25,
							durationDays: 12,
						},
					],
				},
				{
					name: "Albañilería",
					description: "Mampostería, enlucidos y contrapisos",
					durationPercentage: 0.15,
					tasks: [
						{
							name: "Mampostería",
							description: "Construcción de paredes",
							startOffsetDays: 0,
							durationDays: 15,
						},
						{
							name: "Enlucidos",
							description: "Enlucido interior y exterior",
							startOffsetDays: 15,
							durationDays: 10,
						},
						{
							name: "Contrapisos",
							description: "Fundición de contrapisos",
							startOffsetDays: 10,
							durationDays: 8,
						},
					],
				},
				{
					name: "Instalaciones",
					description: "Instalaciones eléctricas, sanitarias y especiales",
					durationPercentage: 0.1,
					tasks: [
						{
							name: "Instalaciones eléctricas",
							description: "Cableado y puntos eléctricos",
							startOffsetDays: 0,
							durationDays: 12,
						},
						{
							name: "Instalaciones sanitarias",
							description: "Tubería y conexiones sanitarias",
							startOffsetDays: 5,
							durationDays: 10,
						},
						{
							name: "Instalaciones especiales",
							description: "Internet, alarmas, etc.",
							startOffsetDays: 15,
							durationDays: 7,
						},
					],
				},
				{
					name: "Acabados",
					description: "Revestimientos, pisos, pintura y carpintería",
					durationPercentage: 0.15,
					tasks: [
						{
							name: "Revestimientos",
							description: "Cerámica en pisos y paredes",
							startOffsetDays: 0,
							durationDays: 10,
						},
						{
							name: "Pintura",
							description: "Pintura interior y exterior",
							startOffsetDays: 10,
							durationDays: 12,
						},
						{
							name: "Carpintería",
							description: "Puertas, ventanas y muebles",
							startOffsetDays: 15,
							durationDays: 15,
						},
					],
				},
			],
			commercial: [
				// Plantillas para proyectos comerciales...
				{
					name: "Planificación y Permisos",
					description: "Diseño, planificación y gestión de permisos",
					durationPercentage: 0.15,
					tasks: [],
				},
				{
					name: "Obra Gris",
					description: "Estructura y albañilería",
					durationPercentage: 0.4,
					tasks: [],
				},
				{
					name: "Instalaciones",
					description: "Instalaciones técnicas y especiales",
					durationPercentage: 0.2,
					tasks: [],
				},
				{
					name: "Acabados",
					description: "Terminaciones y mobiliario",
					durationPercentage: 0.25,
					tasks: [],
				},
			],
			industrial: [
				// Plantillas para proyectos industriales...
				{
					name: "Ingeniería y Planificación",
					description: "Diseño técnico y permisos",
					durationPercentage: 0.2,
					tasks: [],
				},
				{
					name: "Obra Civil",
					description: "Movimiento de tierras y estructura",
					durationPercentage: 0.3,
					tasks: [],
				},
				{
					name: "Instalaciones Industriales",
					description: "Instalaciones técnicas y maquinaria",
					durationPercentage: 0.3,
					tasks: [],
				},
				{
					name: "Acabados y Equipamiento",
					description: "Acabados y puesta en marcha",
					durationPercentage: 0.2,
					tasks: [],
				},
			],
			remodeling: [
				// Plantillas para proyectos de remodelación...
				{
					name: "Demolición",
					description: "Retiro de elementos existentes",
					durationPercentage: 0.15,
					tasks: [],
				},
				{
					name: "Estructura y Albañilería",
					description: "Modificaciones estructurales",
					durationPercentage: 0.3,
					tasks: [],
				},
				{
					name: "Instalaciones",
					description: "Actualización de instalaciones",
					durationPercentage: 0.25,
					tasks: [],
				},
				{
					name: "Acabados",
					description: "Nuevos acabados y equipamiento",
					durationPercentage: 0.3,
					tasks: [],
				},
			],
		};

		// Devolver plantilla según tipo de proyecto o una genérica si no existe
		return (
			templates[projectType] || [
				{
					name: "Planificación",
					description: "Fase de planificación y diseño",
					durationPercentage: 0.25,
					tasks: [],
				},
				{
					name: "Ejecución",
					description: "Fase de ejecución del proyecto",
					durationPercentage: 0.5,
					tasks: [],
				},
				{
					name: "Cierre",
					description: "Fase de finalización y entrega",
					durationPercentage: 0.25,
					tasks: [],
				},
			]
		);
	}
}
