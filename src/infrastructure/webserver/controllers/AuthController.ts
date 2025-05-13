// src/infrastructure/webserver/controllers/AuthController.ts
import {Request, Response} from "express";
import {User} from "../../../domain/models/user/User";
import {AuthService} from "../../../domain/services/AuthService";
import {UserRepository} from "../../../domain/repositories/UserRepository";
import {handleError} from "../utils/errorHandler";
import {UserRole, SubscriptionPlan} from "../../../domain/models/user/User";

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
		// Validate dependencies when controller is created
		if (!authService) {
			throw new Error("AuthController: Missing authService dependency");
		}

		if (!userRepository) {
			throw new Error("AuthController: Missing userRepository dependency");
		}

		console.log("AuthController initialized successfully");
	}

	/**
	 * User login
	 */
	async login(req: Request, res: Response): Promise<void> {
		try {
			const {email, password, totpToken} = req.body;

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

			// Check if 2FA is enabled for this user
			if (user.twoFactorEnabled) {
				// If 2FA is enabled, check if TOTP token was provided
				if (!totpToken) {
					// No token provided, inform client that 2FA is required
					res.status(200).json({
						success: true,
						requireTwoFactor: true,
						message: "Se requiere autenticación de dos factores",
						data: {
							email: user.email,
						},
					});
					return;
				}

				// TOTP token was provided, validate it in the 2FA validation endpoint
				// We'll let that endpoint handle the authentication flow
				return;
			}

			// 2FA is not enabled, proceed with normal login flow

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
	async register(req: Request, res: Response): Promise<void> {
		console.log("Register endpoint called");
		try {
			if (!this.userRepository) {
				console.error("userRepository is undefined");
				res.status(500).json({
					success: false,
					message: "Error interno del servidor - repo undefined",
				});
				return;
			}

			const {
				firstName,
				lastName,
				email,
				password,
				professionalType,
				referralCode,
			} = req.body;

			console.log("Received registration data:", {
				firstName,
				lastName,
				email,
				professionalType,
			});

			// Validate input
			if (!firstName || !lastName || !email || !password) {
				res.status(400).json({
					success: false,
					message: "Todos los campos son requeridos",
				});
				return;
			}

			// Check if user already exists
			console.log(`Checking if user ${email} already exists`);
			const existingUser = await this.userRepository.findByEmail(email);

			if (existingUser) {
				console.log(`User ${email} already exists`);
				res.status(400).json({
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
			console.log(`User registered successfully: ${newUser.id}`);

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
			console.error("Error in registration:", error);
			const typedError = handleError(error);

			res.status(500).json({
				success: false,
				message: "Error al registrar usuario",
				debug:
					process.env.NODE_ENV === "development"
						? typedError.message
						: undefined,
			});
		}
	}

	// Rest of the controller methods...

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
			// This requires searching by verification token
			const users = await this.userRepository.findByVerificationToken(token);

			if (!users || users.length === 0) {
				res.status(400).json({
					success: false,
					message: "Token de verificación inválido o expirado",
				});
				return;
			}

			const user = users[0];

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

			// TODO: In a real application, send an email with the reset link
			console.log(`Reset token for ${email}: ${resetToken}`);
			console.log(`Reset URL would be: /api/auth/reset-password/${resetToken}`);

			res.status(200).json({
				success: true,
				message:
					"Si el correo existe, recibirás instrucciones para restablecer tu contraseña",
				// Include token in response for testing purposes (remove in production)
				...(process.env.NODE_ENV === "development" && {token: resetToken}),
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

			// Find user by reset token and check if token is not expired
			const users = await this.userRepository.findByResetToken(token);

			if (!users || users.length === 0) {
				res.status(400).json({
					success: false,
					message: "Token inválido o expirado",
				});
				return;
			}

			const user = users[0];

			// Check if token is expired
			if (
				!user.passwordResetExpires ||
				new Date() > user.passwordResetExpires
			) {
				res.status(400).json({
					success: false,
					message: "Token expirado",
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

	async devVerifyEmail(req: Request, res: Response): Promise<void> {
		try {
			const { email } = req.params;
			const user = await this.userRepository.findByEmail(email);
    
			if (!user) {
				res.status(404).json({
					success: false,
					message: "Usuario no encontrado",
				});
				return;
			}
    
			await this.userRepository.update(user.id, {
				isVerified: true,
				verificationToken: null,
			});
    
			res.status(200).json({
				success: true,
				message: "Usuario verificado para desarrollo",
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Error al verificar usuario",
			});
		}
	}
}