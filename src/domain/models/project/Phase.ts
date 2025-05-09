// src/domain/models/project/Phase.ts
export interface Phase {
	id: string;
	name: string;
	description?: string;
	startDate: Date;
	endDate?: Date;
	completionPercentage: number;
	projectId: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
