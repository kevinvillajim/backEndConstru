// src/domain/models/project/ProjectBudget.ts
import {BudgetItem} from "./BudgetItem";

export enum BudgetStatus {
	DRAFT = "draft",
	APPROVED = "approved",
	REVISED = "revised",
	EXECUTED = "executed",
}

export interface ProjectBudget {
	id: string;
	name: string;
	description?: string;
	status: BudgetStatus;
	version: number;
	subtotal: number;
	taxPercentage: number;
	tax: number;
	total: number;
	projectId: string;
	items?: BudgetItem[];
	createdAt: Date;
	updatedAt: Date;
}