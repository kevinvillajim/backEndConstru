// src/domain/repositories/UserRepository.ts
import {User} from "../models/user/User";

// Interface (port) for the user repository
export interface UserRepository {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	findByVerificationToken(token: string): Promise<User[]>;
	findByResetToken(token: string): Promise<User[]>;
	create(user: Omit<User, "id">): Promise<User>;
	update(id: string, userData: Partial<User>): Promise<User | null>;
	delete(id: string): Promise<boolean>;
}
