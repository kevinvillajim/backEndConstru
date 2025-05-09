// src/domain/models/project/MaterialRequest.ts
export enum MaterialRequestStatus {
	PENDING = "pending",
	APPROVED = "approved",
	REJECTED = "rejected",
	DELIVERED = "delivered",
}

export interface MaterialRequest {
	id: string;
	taskId: string;
	materialId: string;
	quantity: number;
	status: MaterialRequestStatus;
	requesterId: string;
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
}
