// src/domain/dtos/user/RegisterUserDTO.ts
import {IsEmail, IsNotEmpty, MinLength, IsOptional} from "class-validator";

export class RegisterUserDTO {
	@IsNotEmpty({message: "El nombre es obligatorio"})
	firstName: string;

	@IsNotEmpty({message: "El apellido es obligatorio"})
	lastName: string;

	@IsEmail({}, {message: "Debes proporcionar un email válido"})
	email: string;

	@MinLength(8, {message: "La contraseña debe tener al menos 8 caracteres"})
	password: string;

	@IsOptional()
	professionalType?: string;

	@IsOptional()
	referralCode?: string;
}
