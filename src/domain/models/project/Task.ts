// src/domain/models/project/Task.ts
export enum TaskStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	BLOCKED = "blocked",
}

export interface Task {
	id: string;
	name: string;
	description?: string;
	status: string; // TaskStatus
	startDate?: Date;
	endDate?: Date;
	phaseId: string;
	assignedTo?: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
