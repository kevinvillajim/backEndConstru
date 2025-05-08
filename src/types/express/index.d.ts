// src/types/express/index.d.ts
import {User} from "../../domain/models/user/User";

declare global {
	namespace Express {
		interface Request {
			user?: User;
		}
	}
}

export {};