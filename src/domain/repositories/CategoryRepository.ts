import {Category} from "../models/material/Category";

export interface CategoryRepository {
	findById(id: string): Promise<Category | null>;
	findByName(name: string): Promise<Category | null>;
	findAll(filters?: any): Promise<Category[]>;
	create(category: Omit<Category, "id">): Promise<Category>;
	update(id: string, data: Partial<Category>): Promise<Category | null>;
	delete(id: string): Promise<boolean>;
}
