// src/infrastructure/webserver/controllers/AuthController.ts
import { Request, Response } from "express";
import {User} from "../../../domain/models/user/User";
import {AuthService} from "../../../domain/services/AuthService";
import {UserRepository} from "../../../domain/repositories/UserRepository";
import {handleError} from "../utils/errorHandler";
import { UserRole, SubscriptionPlan } from "../../../domain/models/user/User";
import { v4 as uuidv4 } from "uuid";

interface RequestWithUser extends Request {
	user?: User;
}

// Authentication successful cookie settings
const AUTH_COOKIE_SETTINGS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	path: "/",
};

// Cookie settings for clearing cookies
const CLEAR_COOKIE_SETTINGS = {
	...AUTH_COOKIE_SETTINGS,
	maxAge: 0,
};

export class AuthController {
	constructor(
		private authService: AuthService,
		private userRepository: UserRepository
	) {
		console.log(
			"AuthController construido con:",
			"authService=",
			!!this.authService,
			"userRepository=",
			!!this.userRepository
		);
	}

	/**
	 * User login
	 */
	async login(req: Request, res: Response): Promise<void> {
		try {
			const {email, password} = req.body;

			// Validate input
			if (!email || !password) {
				res.status(400).json({
					success: false,
					message: "El correo electrónico y la contraseña son requeridos",
				});
				return;
			}

			// Find user by email
			const user = await this.userRepository.findByEmail(email);
			if (!user) {
				res.status(401).json({
					success: false,
					message: "Credenciales inválidas",
				});
				return;
			}

			// Check if user is verified
			if (!user.isVerified) {
				res.status(401).json({
					success: false,
					message:
						"Por favor, verifica tu correo electrónico antes de iniciar sesión",
				});
				return;
			}

			// Check if user is active
			if (!user.isActive) {
				res.status(401).json({
					success: false,
					message:
						"Tu cuenta ha sido desactivada. Por favor, contacta al soporte",
				});
				return;
			}

			// Verify password
			const isPasswordValid = await this.authService.comparePassword(
				password,
				user.password
			);

			if (!isPasswordValid) {
				res.status(401).json({
					success: false,
					message: "Credenciales inválidas",
				});
				return;
			}

			// Generate tokens
			const tokens = this.authService.generateTokens(user);

			// Set cookies
			res.cookie("accessToken", tokens.accessToken, {
				...AUTH_COOKIE_SETTINGS,
				maxAge: 15 * 60 * 1000, // 15 minutes
			});

			res.cookie("refreshToken", tokens.refreshToken, {
				...AUTH_COOKIE_SETTINGS,
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			// Update user stats
			if (user.stats) {
				user.stats.lastLoginAt = new Date();
				user.stats.loginCount = (user.stats.loginCount || 0) + 1;
				await this.userRepository.update(user.id, {stats: user.stats});
			}

			// Send user data (without sensitive information)
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
				message: "Inicio de sesión exitoso",
				data: userData,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error de inicio de sesión:", typedError);

			res.status(500).json({
				success: false,
				message: "Error al iniciar sesión",
			});
		}
	}

	/**
	 * User registration
	 */
	register = async (req: Request, res: Response): Promise<void> => {
		try {
			const {
				firstName,
				lastName,
				email,
				password,
				professionalType,
				referralCode,
			} = req.body;

			// Validate input
			if (!firstName || !lastName || !email || !password) {
				res.status(400).json({
					success: false,
					message: "Todos los campos son requeridos",
				});
				return;
			}

			// Check if user already exists
			const existingUser = await this.userRepository.findByEmail(email);
			if (existingUser) {
				res.status(409).json({
					success: false,
					message: "El correo electrónico ya está registrado",
				});
				return;
			}

			// Hash password
			const hashedPassword = await this.authService.hashPassword(password);

			// Create verification token
			const verificationToken =
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15);

			// Create user
			const newUser = await this.userRepository.create({
				firstName,
				lastName,
				email,
				password: hashedPassword,
				professionalType,
				role: UserRole.NORMAL,
				subscriptionPlan: SubscriptionPlan.FREE,
				isActive: true,
				isVerified: false, // Need to verify email
				verificationToken,
				referredBy: referralCode,
				stats: {
					completedProjects: 0,
					activeProjects: 0,
					totalMaterialsOrdered: 0,
					totalSpent: 0,
					avgProjectDuration: 0,
					lastLoginAt: new Date(),
					loginCount: 0,
				},
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			// TODO: Send verification email

			res.status(201).json({
				success: true,
				message:
					"Usuario registrado exitosamente. Por favor, verifica tu correo electrónico",
				data: {
					id: newUser.id,
					email: newUser.email,
				},
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error de registro:", typedError);

			res.status(500).json({
				success: false,
				message: "Error al registrar usuario",
			});
		}
	};

	/**
	 * Refresh access token using refresh token
	 */
	async refreshToken(req: Request, res: Response): Promise<void> {
		try {
			// Get refresh token from cookie
			const refreshToken = req.cookies.refreshToken;

			if (!refreshToken) {
				res.status(401).json({
					success: false,
					message: "Refresh token no encontrado",
				});
				return;
			}

			// Verify refresh token
			const decoded = this.authService.verifyRefreshToken(refreshToken);

			// Find user
			const user = await this.userRepository.findById(decoded.userId);
			if (!user) {
				res.status(401).json({
					success: false,
					message: "Usuario no encontrado",
				});
				return;
			}

			// Generate new tokens
			const tokens = this.authService.generateTokens(user);

			// Set cookies
			res.cookie("accessToken", tokens.accessToken, {
				...AUTH_COOKIE_SETTINGS,
				maxAge: 15 * 60 * 1000, // 15 minutes
			});

			res.cookie("refreshToken", tokens.refreshToken, {
				...AUTH_COOKIE_SETTINGS,
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			res.status(200).json({
				success: true,
				message: "Token actualizado exitosamente",
			});
		} catch (error) {
			// Clear cookies
			res.cookie("accessToken", "", CLEAR_COOKIE_SETTINGS);
			res.cookie("refreshToken", "", CLEAR_COOKIE_SETTINGS);

			res.status(401).json({
				success: false,
				message: "Sesión expirada. Por favor inicia sesión nuevamente",
			});
		}
	}

	/**
	 * User logout
	 */
	async logout(req: Request, res: Response): Promise<void> {
		// Clear cookies
		res.cookie("accessToken", "", CLEAR_COOKIE_SETTINGS);
		res.cookie("refreshToken", "", CLEAR_COOKIE_SETTINGS);

		res.status(200).json({
			success: true,
			message: "Sesión cerrada exitosamente",
		});
	}

	/**
	 * Verify email
	 */
	async verifyEmail(req: Request, res: Response): Promise<void> {
		try {
			const {token} = req.params;

			if (!token) {
				res.status(400).json({
					success: false,
					message: "Token de verificación inválido",
				});
				return;
			}

			// Find user by verification token
			// Note: This would need an additional method in the UserRepository
			// For now, we can improvise with a query
			const userRepository = this.userRepository as any;
			const user = await userRepository.repository.findOne({
				where: {verificationToken: token},
			});

			if (!user) {
				res.status(400).json({
					success: false,
					message: "Token de verificación inválido o expirado",
				});
				return;
			}

			// Update user
			await this.userRepository.update(user.id, {
				isVerified: true,
				verificationToken: null,
			});

			res.status(200).json({
				success: true,
				message: "Correo electrónico verificado exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al verificar correo:", typedError);

			res.status(500).json({
				success: false,
				message: "Error al verificar correo electrónico",
			});
		}
	}

	/**
	 * Request password reset
	 */
	async forgotPassword(req: Request, res: Response): Promise<void> {
		try {
			const {email} = req.body;

			if (!email) {
				res.status(400).json({
					success: false,
					message: "El correo electrónico es requerido",
				});
				return;
			}

			// Find user by email
			const user = await this.userRepository.findByEmail(email);
			if (!user) {
				// Don't reveal that the user doesn't exist for security reasons
				res.status(200).json({
					success: true,
					message:
						"Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
				});
				return;
			}

			// Generate reset token
			const resetToken =
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15);

			// Set expiration (1 hour)
			const resetExpires = new Date();
			resetExpires.setHours(resetExpires.getHours() + 1);

			// Update user
			await this.userRepository.update(user.id, {
				passwordResetToken: resetToken,
				passwordResetExpires: resetExpires,
			});

			// TODO: Send password reset email

			res.status(200).json({
				success: true,
				message:
					"Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al solicitar restablecimiento:", typedError);

			res.status(500).json({
				success: false,
				message: "Error al procesar la solicitud",
			});
		}
	}

	/**
	 * Reset password
	 */
	async resetPassword(req: Request, res: Response): Promise<void> {
		try {
			const {token} = req.params;
			const {password} = req.body;

			if (!token || !password) {
				res.status(400).json({
					success: false,
					message: "Token y nueva contraseña son requeridos",
				});
				return;
			}

			// Find user by reset token
			const userRepository = this.userRepository as any;
			const user = await userRepository.repository.findOne({
				where: {
					passwordResetToken: token,
					passwordResetExpires: {$gt: new Date()},
				},
			});

			if (!user) {
				res.status(400).json({
					success: false,
					message: "Token inválido o expirado",
				});
				return;
			}

			// Hash new password
			const hashedPassword = await this.authService.hashPassword(password);

			// Update user
			await this.userRepository.update(user.id, {
				password: hashedPassword,
				passwordResetToken: null,
				passwordResetExpires: null,
			});

			res.status(200).json({
				success: true,
				message: "Contraseña actualizada exitosamente",
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al restablecer contraseña:", typedError);

			res.status(500).json({
				success: false,
				message: "Error al restablecer contraseña",
			});
		}
	}

	/**
	 * Get current user profile
	 */
	async getProfile(req: RequestWithUser, res: Response): Promise<void> {
		try {
			// User is already set by the auth middleware
			if (!req.user) {
				res.status(401).json({
					success: false,
					message: "No autorizado",
				});
				return;
			}

			// Send user data (without sensitive information)
			const userData = {
				id: req.user.id,
				firstName: req.user.firstName,
				lastName: req.user.lastName,
				email: req.user.email,
				role: req.user.role,
				subscriptionPlan: req.user.subscriptionPlan,
				profilePicture: req.user.profilePicture,
				professionalType: req.user.professionalType,
				company: req.user.company,
				specializations: req.user.specializations,
				yearsOfExperience: req.user.yearsOfExperience,
				stats: req.user.stats,
			};

			res.status(200).json({
				success: true,
				data: userData,
			});
		} catch (error) {
			const typedError = handleError(error);
			console.error("Error al obtener perfil:", typedError);

			res.status(500).json({
				success: false,
				message: "Error al obtener perfil de usuario",
			});
		}
	}
}
