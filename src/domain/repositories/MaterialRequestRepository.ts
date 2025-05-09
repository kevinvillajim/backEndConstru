// src/domain/repositories/MaterialRequestRepository.ts
import {MaterialRequest} from "../models/project/MaterialRequest";

export interface MaterialRequestRepository {
	findById(id: string): Promise<MaterialRequest | null>;
	findByTask(taskId: string): Promise<MaterialRequest[]>;
	findByProject(projectId: string, filters?: any): Promise<MaterialRequest[]>;
	findByRequester(requesterId: string): Promise<MaterialRequest[]>;
	create(request: MaterialRequest): Promise<MaterialRequest>;
	update(id: string, data: Partial<MaterialRequest>): Promise<boolean>;
	delete(id: string): Promise<boolean>;
}
