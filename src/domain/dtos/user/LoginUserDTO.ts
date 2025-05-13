// src/domain/dtos/user/LoginUserDTO.ts
import {IsEmail, IsNotEmpty} from "class-validator";

export class LoginUserDTO {
	@IsEmail({}, {message: "El correo electrónico debe tener un formato válido"})
	@IsNotEmpty({message: "El correo electrónico es obligatorio"})
	email: string;

	@IsNotEmpty({message: "La contraseña es obligatoria"})
	password: string;
}
