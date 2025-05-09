// src/domain/repositories/TaskRepository.ts
import {Task} from "../models/project/Task";

export interface TaskRepository {
	findById(id: string): Promise<Task | null>;
	findByPhase(phaseId: string): Promise<Task[]>;
	create(task: Task): Promise<Task>;
	createMany(tasks: Task[]): Promise<Task[]>;
	update(id: string, taskData: Partial<Task>): Promise<Task | null>;
	delete(id: string): Promise<boolean>;
}
