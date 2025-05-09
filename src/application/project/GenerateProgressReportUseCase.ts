// src/application/project/GenerateProgressReportUseCase.ts
import {ProjectRepository} from "../../domain/repositories/ProjectRepository";
import {PhaseRepository} from "../../domain/repositories/PhaseRepository";
import {TaskRepository} from "../../domain/repositories/TaskRepository";
import {NotificationService} from "../../domain/services/NotificationService";
import {TaskStatus} from "../../domain/models/project/Task";
import {
	NotificationType,
	NotificationPriority,
} from "../../infrastructure/database/entities/NotificationEntity";

export interface ProgressReport {
	projectId: string;
	projectName: string;
	reportDate: Date;
	startDate: Date;
	daysElapsed: number;
	estimatedDuration: number;
	completionPercentage: number;
	expectedCompletionPercentage: number;
	delay: number; // Días de retraso (negativo significa adelanto)
	phases: {
		id: string;
		name: string;
		completionPercentage: number;
		status: string;
		tasks: {
			id: string;
			name: string;
			status: TaskStatus;
			assigneeName: string;
			completedDate?: Date;
		}[];
	}[];
	alerts: {
		type: string;
		severity: string;
		message: string;
		entityId: string;
	}[];
}

export class GenerateProgressReportUseCase {
	constructor(
		private projectRepository: ProjectRepository,
		private phaseRepository: PhaseRepository,
		private taskRepository: TaskRepository,
		private notificationService: NotificationService
	) {}

	async execute(projectId: string, userId: string): Promise<ProgressReport> {
		// 1. Obtener datos del proyecto
		const project = await this.projectRepository.findById(projectId);

		if (!project) {
			throw new Error(`Proyecto no encontrado: ${projectId}`);
		}

		// 2. Verificar permisos del usuario (el dueño del proyecto o miembro del equipo)
		if (project.userId !== userId) {
			// Aquí se podría verificar si el usuario es parte del equipo
			// pero por simplicidad solo verificamos si es el dueño
			throw new Error("No tienes permiso para ver este informe");
		}

		// 3. Obtener fases y tareas
		const phases = await this.phaseRepository.findByProject(projectId);
		const alerts = [];

		// 4. Calcular métricas de progreso
		const now = new Date();
		const startDate = project.startDate;
		const estimatedEndDate = project.estimatedCompletionDate || new Date();

		const daysElapsed = Math.floor(
			(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);
		const totalDuration = Math.floor(
			(estimatedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		// Calcular porcentaje esperado basado en días transcurridos
		const expectedCompletionPercentage = Math.min(
			100,
			(daysElapsed / totalDuration) * 100
		);

		// Calcular retraso (diferencia entre progreso esperado y real)
		const delay =
			((expectedCompletionPercentage - project.completionPercentage) *
				totalDuration) /
			100;

		// 5. Procesar fases y tareas para el informe
		const phaseReports = await Promise.all(
			phases.map(async (phase) => {
				const tasks = await this.taskRepository.findByPhase(phase.id);

				// Calcular estado de la fase
				let phaseStatus = "En tiempo";
				if (phase.completionPercentage < 25) {
					phaseStatus = "Iniciando";
				} else if (
					phase.completionPercentage >= 25 &&
					phase.completionPercentage < 75
				) {
					phaseStatus = "En progreso";
				} else if (
					phase.completionPercentage >= 75 &&
					phase.completionPercentage < 100
				) {
					phaseStatus = "Avanzado";
				} else if (phase.completionPercentage >= 100) {
					phaseStatus = "Completado";
				}

				// Verificar si la fase está retrasada
				const phaseEndDate = phase.endDate || new Date();
				if (phaseEndDate < now && phase.completionPercentage < 100) {
					phaseStatus = "Retrasado";

					// Añadir alerta por fase retrasada
					alerts.push({
						type: "phase_delay",
						severity: "high",
						message: `La fase "${phase.name}" está retrasada. Debería haber finalizado el ${phaseEndDate.toLocaleDateString()}.`,
						entityId: phase.id,
					});

					// Enviar notificación sobre fase retrasada
					await this.notificationService.sendToUser(userId, {
						title: "Fase retrasada",
						content: `La fase "${phase.name}" está retrasada y debería haber finalizado el ${phaseEndDate.toLocaleDateString()}.`,
						type: NotificationType.PROJECT_DELAY,
						priority: NotificationPriority.HIGH,
						relatedEntityType: "phase",
						relatedEntityId: phase.id,
						actionUrl: `/projects/${projectId}/phases/${phase.id}`,
						actionText: "Ver fase",
					});
				}

				// Procesar tareas
				const taskReports = tasks.map((task) => {
					// Verificar tareas bloqueadas
					if (task.status === TaskStatus.BLOCKED) {
						alerts.push({
							type: "task_blocked",
							severity: "medium",
							message: `La tarea "${task.name}" está bloqueada.`,
							entityId: task.id,
						});
					}

					return {
						id: task.id,
						name: task.name,
						status: task.status as TaskStatus,
						assigneeName: "Asignado", // Aquí se debería obtener el nombre del asignado
						completedDate:
							task.status === TaskStatus.COMPLETED ? task.updatedAt : undefined,
					};
				});

				return {
					id: phase.id,
					name: phase.name,
					completionPercentage: phase.completionPercentage,
					status: phaseStatus,
					tasks: taskReports,
				};
			})
		);

		// 6. Generar alertas por retraso general del proyecto
		if (delay > 5) {
			// Más de 5 días de retraso
			alerts.push({
				type: "project_delay",
				severity: "critical",
				message: `El proyecto está retrasado aproximadamente ${Math.round(delay)} días.`,
				entityId: projectId,
			});

			// Enviar notificación sobre retraso del proyecto
			await this.notificationService.sendToProjectMembers(projectId, {
				title: "Proyecto retrasado",
				content: `El proyecto "${project.name}" presenta un retraso de aproximadamente ${Math.round(delay)} días.`,
				type: NotificationType.PROJECT_DELAY,
				priority: NotificationPriority.CRITICAL,
				relatedEntityType: "project",
				relatedEntityId: projectId,
				actionUrl: `/projects/${projectId}/dashboard`,
				actionText: "Ver dashboard",
			});
		}

		// 7. Retornar el informe completo
		return {
			projectId,
			projectName: project.name,
			reportDate: now,
			startDate: project.startDate,
			daysElapsed,
			estimatedDuration: totalDuration,
			completionPercentage: project.completionPercentage,
			expectedCompletionPercentage,
			delay,
			phases: phaseReports,
			alerts,
		};
	}
}
