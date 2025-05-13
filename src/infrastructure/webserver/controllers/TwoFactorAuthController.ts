// src/infrastructure/webserver/controllers/TwoFactorAuthController.ts
import {Request, Response} from "express";
import {TwoFactorAuthService} from "../../../domain/services/TwoFactorAuthService";
import {UserRepository} from "../../../domain/repositories/UserRepository";
import {AuthService} from "../../../domain/services/AuthService";
import {handleError} from "../utils/errorHandler";
import {RequestWithUser} from "../middlewares/authMiddleware";

export class TwoFactorAuthController {
	constructor(
		private twoFactorAuthService: TwoFactorAuthService,
		private userRepository: UserRepository,
		private authService: AuthService
	) {}

	/**
	 * Setup two-factor authentication for a user
	 */
	async setupTwoFactor(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			// Generate a new secret for the user
			const secret = this.twoFactorAuthService.generateSecret();

			// Generate QR code
			const qrCodeUrl = await this.twoFactorAuthService.generateQRCode(
				req.user.email,
				secret
			);

			// Store the secret temporarily (but don't enable 2FA yet)
			await this.userRepository.update(req.user.id, {
				twoFactorSecret: secret,
				twoFactorEnabled: false,
			});

			res.status(200).json({
				success: true,
				message: "Configuración de autenticación de dos factores iniciada",
				data: {
					qrCodeUrl,
					secret,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message ||
					"Error al configurar autenticación de dos factores",
			});
		}
	}

	/**
	 * Verify token and enable two-factor authentication
	 */
	async verifyAndEnableTwoFactor(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {token} = req.body;

			if (!token) {
				res.status(400).json({
					success: false,
					message: "Token requerido",
				});
				return;
			}

			// Retrieve user with 2FA secret
			const user = await this.userRepository.findById(req.user.id);

			if (!user || !user.twoFactorSecret) {
				res.status(400).json({
					success: false,
					message:
						"Configuración de 2FA no iniciada. Por favor, inicia la configuración primero.",
				});
				return;
			}

			// Verify token
			const isValid = this.twoFactorAuthService.verifyToken(
				token,
				user.twoFactorSecret
			);

			if (!isValid) {
				res.status(400).json({
					success: false,
					message: "Token inválido. Por favor, intenta de nuevo.",
				});
				return;
			}

			// Generate recovery codes
			const recoveryCodes = this.twoFactorAuthService.generateRecoveryCodes();

			// Enable 2FA and store recovery codes
			await this.userRepository.update(user.id, {
				twoFactorEnabled: true,
				recoveryCodes,
			});

			res.status(200).json({
				success: true,
				message: "Autenticación de dos factores habilitada exitosamente",
				data: {
					recoveryCodes,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message ||
					"Error al verificar y habilitar autenticación de dos factores",
			});
		}
	}

	/**
	 * Disable two-factor authentication
	 */
	async disableTwoFactor(req: RequestWithUser, res: Response): Promise<void> {
		try {
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
				return;
			}

			const {password} = req.body;

			if (!password) {
				res.status(400).json({
					success: false,
					message: "Se requiere contraseña para confirmar",
				});
				return;
			}

			// Get user with password
			const user = await this.userRepository.findById(req.user.id);
			if (!user) {
				res.status(404).json({
					success: false,
					message: "Usuario no encontrado",
				});
				return;
			}

			// Verify password
			const isPasswordValid = await this.authService.comparePassword(
				password,
				user.password
			);

			if (!isPasswordValid) {
				res.status(400).json({
					success: false,
					message: "Contraseña incorrecta",
				});
				return;
			}

			// Disable 2FA
			await this.userRepository.update(user.id, {
				twoFactorEnabled: false,
				twoFactorSecret: null,
				recoveryCodes: null,
			});

			res.status(200).json({
				success: true,
				message: "Autenticación de dos factores deshabilitada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message ||
					"Error al deshabilitar autenticación de dos factores",
			});
		}
	}

	/**
	 * Validate a 2FA token during login
	 */
	async validateTwoFactorToken(req: Request, res: Response): Promise<void> {
		try {
			const {email, token} = req.body;

			if (!email || !token) {
				res.status(400).json({
					success: false,
					message: "Email y token son requeridos",
				});
				return;
			}

			// Find user by email
			const user = await this.userRepository.findByEmail(email);
			if (!user) {
				res.status(404).json({
					success: false,
					message: "Usuario no encontrado",
				});
				return;
			}

			// Check if user has 2FA enabled
			if (!user.twoFactorEnabled || !user.twoFactorSecret) {
				res.status(400).json({
					success: false,
					message:
						"Autenticación de dos factores no habilitada para este usuario",
				});
				return;
			}

			// Verify the token
			const isValid = this.twoFactorAuthService.verifyToken(
				token,
				user.twoFactorSecret
			);

			if (!isValid) {
				res.status(400).json({
					success: false,
					message: "Token inválido o expirado",
				});
				return;
			}

			// Token is valid, generate auth tokens
			const tokens = this.authService.generateTokens(user);

			// Set cookies
			res.cookie("accessToken", tokens.accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 15 * 60 * 1000, // 15 minutes
			});

			res.cookie("refreshToken", tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			// Send user data without sensitive information
			const userData = {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				role: user.role,
				subscriptionPlan: user.subscriptionPlan,
				profilePicture: user.profilePicture,
				professionalType: user.professionalType,
			};

			res.status(200).json({
				success: true,
				message: "Autenticación de dos factores exitosa",
				data: userData,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message ||
					"Error al validar token de autenticación de dos factores",
			});
		}
	}

	/**
	 * Use a recovery code to log in
	 */
	async useRecoveryCode(req: Request, res: Response): Promise<void> {
		try {
			const {email, recoveryCode} = req.body;

			if (!email || !recoveryCode) {
				res.status(400).json({
					success: false,
					message: "Email y código de recuperación son requeridos",
				});
				return;
			}

			// Find user by email
			const user = await this.userRepository.findByEmail(email);
			if (!user) {
				res.status(404).json({
					success: false,
					message: "Usuario no encontrado",
				});
				return;
			}

			// Check if user has 2FA enabled and recovery codes
			if (
				!user.twoFactorEnabled ||
				!user.recoveryCodes ||
				user.recoveryCodes.length === 0
			) {
				res.status(400).json({
					success: false,
					message: "Usuario no tiene códigos de recuperación configurados",
				});
				return;
			}

			// Verify the recovery code
			const isValid = this.twoFactorAuthService.verifyRecoveryCode(
				recoveryCode,
				user.recoveryCodes
			);

			if (!isValid) {
				res.status(400).json({
					success: false,
					message: "Código de recuperación inválido",
				});
				return;
			}

			// Remove the used recovery code
			const updatedRecoveryCodes = this.twoFactorAuthService.removeRecoveryCode(
				recoveryCode,
				user.recoveryCodes
			);

			// Update user's recovery codes
			await this.userRepository.update(user.id, {
				recoveryCodes: updatedRecoveryCodes,
			});

			// Generate auth tokens
			const tokens = this.authService.generateTokens(user);

			// Set cookies
			res.cookie("accessToken", tokens.accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 15 * 60 * 1000, // 15 minutes
			});

			res.cookie("refreshToken", tokens.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "strict",
				path: "/",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			// Send user data without sensitive information
			const userData = {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				role: user.role,
				subscriptionPlan: user.subscriptionPlan,
				profilePicture: user.profilePicture,
				professionalType: user.professionalType,
			};

			res.status(200).json({
				success: true,
				message:
					"Login exitoso con código de recuperación. Quedan " +
					updatedRecoveryCodes.length +
					" códigos.",
				data: userData,
			});
		} catch (error) {
			const typedError = handleError(error);
			res.status(500).json({
				success: false,
				message:
					typedError.message || "Error al procesar código de recuperación",
			});
		}
	}
}
