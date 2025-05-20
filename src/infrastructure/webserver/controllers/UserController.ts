// src/infrastructure/webserver/controllers/UserController.ts
import {Response} from "express";
import {UpdateUserPersonalInfoDTO} from "../../../domain/dtos/user/UpdateUserPersonalInfoDTO";
import {UpdateUserProfessionalInfoDTO} from "../../../domain/dtos/user/UpdateUserProfessionalInfoDTO";
import {UpdateUserPreferencesDTO} from "../../../domain/dtos/user/UpdateUserPreferencesDTO";
import {UpdateUserAddressDTO} from "../../../domain/dtos/user/UpdateUserAddressDTO";
import {UserService} from "../../../application/user/UserService";
import {UserPatternAnalysisService} from "../../../domain/services/UserPatternAnalysisService";
import {UserInteractionRepository} from "../../../domain/repositories/UserInteractionRepository";
import multer from "multer";
import path from "path";
import fs from "fs";
import {v4 as uuidv4} from "uuid";
import {RequestWithUser} from "../middlewares/authMiddleware";

export interface MulterRequest extends RequestWithUser {
	file?: Express.Multer.File;
	files?: Express.Multer.File[];
}

export class UserController {
	private userService: UserService;
	private userPatternAnalysisService: UserPatternAnalysisService;
	private userInteractionRepository: UserInteractionRepository;

	constructor(
		userService: UserService,
		userPatternAnalysisService: UserPatternAnalysisService,
		userInteractionRepository: UserInteractionRepository
	) {
		this.userService = userService;
		this.userPatternAnalysisService = userPatternAnalysisService;
		this.userInteractionRepository = userInteractionRepository;
	}

	// Get user profile
	async getProfile(req: RequestWithUser, res: Response) {
		try {
			// User ID should be set in auth middleware
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const userProfile = await this.userService.getUserProfile(userId);

			return res.status(200).json({
				success: true,
				data: userProfile,
			});
		} catch (error: any) {
			console.error("Error getting user profile:", error);
			return res.status(500).json({
				success: false,
				message: "Error al obtener perfil de usuario",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Update personal information
	async updatePersonalInfo(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const personalInfoDTO: UpdateUserPersonalInfoDTO = req.body;
			const updatedUser = await this.userService.updatePersonalInfo(
				userId,
				personalInfoDTO
			);

			return res.status(200).json({
				success: true,
				message: "Información personal actualizada correctamente",
				data: updatedUser,
			});
		} catch (error: any) {
			console.error("Error updating personal info:", error);
			return res.status(500).json({
				success: false,
				message: "Error al actualizar información personal",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Update professional information
	async updateProfessionalInfo(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const professionalInfoDTO: UpdateUserProfessionalInfoDTO = req.body;
			const updatedUser = await this.userService.updateProfessionalInfo(
				userId,
				professionalInfoDTO
			);

			return res.status(200).json({
				success: true,
				message: "Información profesional actualizada correctamente",
				data: updatedUser,
			});
		} catch (error: any) {
			console.error("Error updating professional info:", error);
			return res.status(500).json({
				success: false,
				message: "Error al actualizar información profesional",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Update user preferences
	async updatePreferences(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const preferencesDTO: UpdateUserPreferencesDTO = req.body;
			const updatedPreferences = await this.userService.updatePreferences(
				userId,
				preferencesDTO
			);

			return res.status(200).json({
				success: true,
				message: "Preferencias actualizadas correctamente",
				data: updatedPreferences,
			});
		} catch (error: any) {
			console.error("Error updating preferences:", error);
			return res.status(500).json({
				success: false,
				message: "Error al actualizar preferencias",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Get user addresses
	async getAddresses(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const addresses = await this.userService.getUserAddresses(userId);

			return res.status(200).json({
				success: true,
				data: addresses,
			});
		} catch (error: any) {
			console.error("Error getting addresses:", error);
			return res.status(500).json({
				success: false,
				message: "Error al obtener direcciones",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Add/update address
	async updateAddress(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const addressDTO: UpdateUserAddressDTO = req.body;
			const addressId = req.params.addressId;

			let updatedAddress;
			if (addressId && addressId !== "new") {
				// Update existing address
				updatedAddress = await this.userService.updateAddress(
					userId,
					addressId,
					addressDTO
				);
			} else {
				// Add new address
				updatedAddress = await this.userService.addAddress(userId, addressDTO);
			}

			return res.status(200).json({
				success: true,
				message:
					addressId && addressId !== "new"
						? "Dirección actualizada correctamente"
						: "Dirección agregada correctamente",
				data: updatedAddress,
			});
		} catch (error: any) {
			console.error("Error updating address:", error);
			return res.status(500).json({
				success: false,
				message: "Error al actualizar dirección",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Delete address
	async deleteAddress(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			const addressId = req.params.addressId;
			const success = await this.userService.deleteAddress(userId, addressId);

			if (!success) {
				return res.status(404).json({
					success: false,
					message: "Dirección no encontrada",
				});
			}

			return res.status(200).json({
				success: true,
				message: "Dirección eliminada correctamente",
			});
		} catch (error: any) {
			console.error("Error deleting address:", error);
			return res.status(500).json({
				success: false,
				message: "Error al eliminar dirección",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}

	// Upload profile picture
	async uploadProfilePicture(
		req: RequestWithUser,
		res: Response
	): Promise<void> {
		// Configurar el middleware para una única ejecución
		const upload = multer({
			storage: multer.diskStorage({
				destination: (req, file, cb) => {
					const uploadPath = path.join(
						__dirname,
						"../../../../uploads/profile-pictures"
					);
					fs.mkdirSync(uploadPath, {recursive: true});
					cb(null, uploadPath);
				},
				filename: (req, file, cb) => {
					const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
					cb(null, uniqueName);
				},
			}),
			limits: {fileSize: 5 * 1024 * 1024}, // 5MB limit
		});
		const uploadSingle = upload.single("profilePicture");

		uploadSingle(req, res, async (err) => {
			if (err instanceof multer.MulterError) {
				// Error de Multer durante la subida
				return res.status(400).json({
					success: false,
					message: `Error de Multer: ${err.message}`,
				});
			} else if (err) {
				// Otro tipo de error
				return res.status(400).json({
					success: false,
					message: err.message || "Error al subir imagen",
				});
			}

			try {
				if (!req.user?.id) {
					return res.status(401).json({
						success: false,
						message: "Usuario no autenticado",
					});
				}

				if (!req.file) {
					return res.status(400).json({
						success: false,
						message: "No se proporcionó ninguna imagen",
					});
				}

				// Actualizar perfil con nueva imagen
				const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
				const updatedUser = await this.userService.updateProfilePicture(
					req.user.id,
					profilePicturePath
				);

				return res.status(200).json({
					success: true,
					message: "Imagen de perfil actualizada correctamente",
					data: {
						profilePicture: profilePicturePath,
					},
				});
			} catch (error: any) {
				console.error("Error al actualizar imagen de perfil:", error);
				return res.status(500).json({
					success: false,
					message: "Error al actualizar imagen de perfil",
					errors: [
						{
							field: "general",
							message: error.message || "Error interno del servidor",
						},
					],
				});
			}
		});
	}

	// Get behavior pattern (for recommendations)
	async getBehaviorPattern(req: RequestWithUser, res: Response) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				return res.status(401).json({
					success: false,
					message: "Usuario no autenticado",
				});
			}

			// Get time range from query param (default to 30 days)
			const timeRangeParam = req.query.timeRange as string;
			let timeRange: number | undefined;

			if (timeRangeParam) {
				switch (timeRangeParam) {
					case "30days":
						timeRange = 30;
						break;
					case "90days":
						timeRange = 90;
						break;
					case "allTime":
						timeRange = undefined; // No time filter
						break;
					default:
						timeRange = 30; // Default to 30 days
				}
			} else {
				timeRange = 30; // Default to 30 days
			}

			// Get user interactions
			const interactions = await this.userInteractionRepository.findByUserId(
				userId,
				{
					limit: 1000, // High limit to get comprehensive data
					startDate: timeRange
						? new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
						: undefined,
				}
			);

			// Analyze behavior pattern
			const behaviorPattern =
				await this.userPatternAnalysisService.analyzeUserPatterns(
					userId,
					interactions,
					timeRange
						? {
								start: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000),
								end: new Date(),
							}
						: undefined
				);

			// Get similar users
			const similarUsers =
				await this.userPatternAnalysisService.findSimilarUsers(userId);

			return res.status(200).json({
				success: true,
				data: {
					behaviorPattern,
					similarUsers,
				},
			});
		} catch (error: any) {
			console.error("Error getting behavior pattern:", error);
			return res.status(500).json({
				success: false,
				message: "Error al obtener patrón de comportamiento",
				errors: [
					{
						field: "general",
						message: error.message || "Error interno del servidor",
					},
				],
			});
		}
	}
}
