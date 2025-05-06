import {User} from "../models/user/User";

// Interfaz (puerto) para el repositorio de usuarios
export interface UserRepository {
	findById(id: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	create(user: User): Promise<User>;
	update(id: string, userData: Partial<User>): Promise<User | null>;
	delete(id: string): Promise<boolean>;
}
