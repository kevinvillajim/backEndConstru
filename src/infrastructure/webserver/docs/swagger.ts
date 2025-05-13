// src/infrastructure/webserver/docs/swagger.ts
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import {Express} from "express";

// Swagger definition
const swaggerDefinition = {
	openapi: "3.0.0",
	info: {
		title: "CONSTRU API Documentation",
		version: "1.0.0",
		description:
			"API documentation for CONSTRU - Plataforma integral para profesionales de la construcción en Ecuador",
		contact: {
			name: "CONSTRU Support",
			url: "https://constru-app.com",
			email: "soporte@constru-app.com",
		},
		license: {
			name: "Proprietary",
			url: "https://constru-app.com/terms",
		},
	},
	servers: [
		{
			url: process.env.API_URL_DEV || "http://localhost:4000",
			description: "Development server",
		},
		{
			url: process.env.API_URL_PROD || "https://api.constru-app.com",
			description: "Production server",
		},
	],
	tags: [
		{
			name: "Auth",
			description: "Autenticación y gestión de usuarios",
		},
		{
			name: "Calculations",
			description: "Cálculos técnicos de construcción",
		},
		{
			name: "Materials",
			description: "Gestión de materiales",
		},
		{
			name: "Projects",
			description: "Gestión de proyectos",
		},
		{
			name: "Budgets",
			description: "Presupuestos y gestión financiera",
		},
	],
	components: {
		securitySchemes: {
			cookieAuth: {
				type: "apiKey",
				in: "cookie",
				name: "accessToken",
			},
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				bearerFormat: "JWT",
			},
		},
		schemas: {
			User: {
				type: "object",
				properties: {
					id: {
						type: "string",
						format: "uuid",
					},
					firstName: {
						type: "string",
					},
					lastName: {
						type: "string",
					},
					email: {
						type: "string",
						format: "email",
					},
					role: {
						type: "string",
						enum: ["admin", "normal", "seller", "worker"],
					},
					professionalType: {
						type: "string",
						enum: [
							"architect",
							"civil_engineer",
							"constructor",
							"contractor",
							"electrician",
							"plumber",
							"designer",
							"other",
						],
					},
					subscriptionPlan: {
						type: "string",
						enum: ["free", "premium", "enterprise", "custom"],
					},
					isActive: {
						type: "boolean",
					},
					isVerified: {
						type: "boolean",
					},
				},
			},
			AuthTokens: {
				type: "object",
				properties: {
					accessToken: {
						type: "string",
					},
					refreshToken: {
						type: "string",
					},
				},
			},
			LoginRequest: {
				type: "object",
				required: ["email", "password"],
				properties: {
					email: {
						type: "string",
						format: "email",
					},
					password: {
						type: "string",
						format: "password",
					},
					totpToken: {
						type: "string",
						description: "Token for two-factor authentication (if enabled)",
					},
				},
			},
			RegisterRequest: {
				type: "object",
				required: ["firstName", "lastName", "email", "password"],
				properties: {
					firstName: {
						type: "string",
						minLength: 2,
						maxLength: 50,
					},
					lastName: {
						type: "string",
						minLength: 2,
						maxLength: 50,
					},
					email: {
						type: "string",
						format: "email",
					},
					password: {
						type: "string",
						format: "password",
						minLength: 8,
					},
					professionalType: {
						type: "string",
					},
					referralCode: {
						type: "string",
					},
				},
			},
			ErrorResponse: {
				type: "object",
				properties: {
					success: {
						type: "boolean",
						example: false,
					},
					message: {
						type: "string",
					},
					errors: {
						type: "array",
						items: {
							type: "object",
							properties: {
								field: {
									type: "string",
								},
								message: {
									type: "string",
								},
							},
						},
					},
				},
			},
			// Add more schema definitions for other entities
		},
		responses: {
			UnauthorizedError: {
				description: "Usuario no autenticado",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/ErrorResponse",
						},
						example: {
							success: false,
							message: "Usuario no autenticado",
						},
					},
				},
			},
			ForbiddenError: {
				description: "No tienes permiso para acceder a este recurso",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/ErrorResponse",
						},
						example: {
							success: false,
							message: "No tienes permiso para acceder a este recurso",
						},
					},
				},
			},
			CalculationTemplate: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					name: {type: "string"},
					description: {type: "string"},
					type: {
						type: "string",
						enum: [
							"material_calculation",
							"structural_calculation",
							"cost_calculation",
							"time_calculation",
							"area_calculation",
						],
					},
					formula: {type: "string"},
					targetProfessions: {
						type: "array",
						items: {
							type: "string",
							enum: [
								"architect",
								"civil_engineer",
								"constructor",
								"contractor",
								"electrician",
								"plumber",
								"designer",
							],
						},
					},
					isActive: {type: "boolean"},
					isVerified: {type: "boolean"},
					isFeatured: {type: "boolean"},
					shareLevel: {
						type: "string",
						enum: ["private", "public", "organization"],
					},
					createdBy: {type: "string", format: "uuid"},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
					tags: {type: "array", items: {type: "string"}},
				},
			},
			CalculationParameter: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					templateId: {type: "string", format: "uuid"},
					name: {type: "string"},
					label: {type: "string"},
					type: {
						type: "string",
						enum: ["number", "string", "boolean", "select", "date"],
					},
					unit: {type: "string"},
					defaultValue: {type: "string"},
					required: {type: "boolean"},
					order: {type: "integer"},
					options: {type: "array", items: {type: "string"}},
					min: {type: "number"},
					max: {type: "number"},
				},
			},
			CalculationResult: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					templateId: {type: "string", format: "uuid"},
					projectId: {type: "string", format: "uuid"},
					parameters: {type: "object"},
					results: {type: "object"},
					name: {type: "string"},
					notes: {type: "string"},
					usedInProject: {type: "boolean"},
					createdBy: {type: "string", format: "uuid"},
					createdAt: {type: "string", format: "date-time"},
				},
			},
			ProjectBudget: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					projectId: {type: "string", format: "uuid"},
					name: {type: "string"},
					description: {type: "string"},
					status: {
						type: "string",
						enum: ["draft", "submitted", "approved", "rejected", "revised"],
					},
					totalAmount: {type: "number"},
					version: {type: "integer"},
					parentBudgetId: {type: "string", format: "uuid"},
					createdBy: {type: "string", format: "uuid"},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			MaterialRequest: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					taskId: {type: "string", format: "uuid"},
					materialId: {type: "string", format: "uuid"},
					quantity: {type: "number"},
					status: {
						type: "string",
						enum: ["pending", "approved", "rejected", "delivered"],
					},
					notes: {type: "string"},
					requestedBy: {type: "string", format: "uuid"},
					approvedBy: {type: "string", format: "uuid"},
					approvedAt: {type: "string", format: "date-time"},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			Task: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					phaseId: {type: "string", format: "uuid"},
					name: {type: "string"},
					description: {type: "string"},
					status: {
						type: "string",
						enum: [
							"pending",
							"in_progress",
							"completed",
							"delayed",
							"cancelled",
						],
					},
					startDate: {type: "string", format: "date-time"},
					endDate: {type: "string", format: "date-time"},
					actualStartDate: {type: "string", format: "date-time"},
					actualEndDate: {type: "string", format: "date-time"},
					progress: {type: "number"},
					assigneeId: {type: "string", format: "uuid"},
					priority: {
						type: "string",
						enum: ["low", "medium", "high", "critical"],
					},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			Phase: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					projectId: {type: "string", format: "uuid"},
					name: {type: "string"},
					description: {type: "string"},
					order: {type: "integer"},
					startDate: {type: "string", format: "date-time"},
					endDate: {type: "string", format: "date-time"},
					status: {
						type: "string",
						enum: ["pending", "in_progress", "completed", "delayed"],
					},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			Material: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					name: {type: "string"},
					description: {type: "string"},
					categoryId: {type: "string", format: "uuid"},
					price: {type: "number"},
					unit: {type: "string"},
					stock: {type: "integer"},
					sellerId: {type: "string", format: "uuid"},
					isActive: {type: "boolean"},
					isFeatured: {type: "boolean"},
					images: {type: "array", items: {type: "string"}},
					tags: {type: "array", items: {type: "string"}},
					viewCount: {type: "integer"},
					orderCount: {type: "integer"},
					rating: {type: "number"},
					ratingCount: {type: "integer"},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			Order: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					userId: {type: "string", format: "uuid"},
					projectId: {type: "string", format: "uuid"},
					status: {
						type: "string",
						enum: [
							"pending",
							"processing",
							"shipped",
							"delivered",
							"cancelled",
						],
					},
					paymentStatus: {
						type: "string",
						enum: ["pending", "paid", "partially_paid", "refunded", "failed"],
					},
					shippingAddress: {type: "object"},
					totalAmount: {type: "number"},
					notes: {type: "string"},
					expectedDeliveryDate: {type: "string", format: "date-time"},
					actualDeliveryDate: {type: "string", format: "date-time"},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			Notification: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					userId: {type: "string", format: "uuid"},
					title: {type: "string"},
					content: {type: "string"},
					type: {type: "string"},
					isRead: {type: "boolean"},
					actionUrl: {type: "string"},
					actionText: {type: "string"},
					icon: {type: "string"},
					priority: {type: "string", enum: ["low", "normal", "high", "urgent"]},
					createdAt: {type: "string", format: "date-time"},
				},
			},
			ProjectDocument: {
				type: "object",
				properties: {
					id: {type: "string", format: "uuid"},
					name: {type: "string"},
					description: {type: "string"},
					type: {
						type: "string",
						enum: [
							"contract",
							"blueprint",
							"permit",
							"invoice",
							"report",
							"specification",
							"photo",
							"other",
						],
					},
					filePath: {type: "string"},
					fileSize: {type: "integer"},
					fileType: {type: "string"},
					version: {type: "integer"},
					projectId: {type: "string", format: "uuid"},
					uploadedBy: {type: "string", format: "uuid"},
					createdAt: {type: "string", format: "date-time"},
					updatedAt: {type: "string", format: "date-time"},
				},
			},
			// Add more response definitions
		},
	},
	security: [
		{
			cookieAuth: [],
		},
		{
			bearerAuth: [],
		},
	],
};

// Options for the swagger docs
const options = {
	swaggerDefinition,
	// Path to the API docs
	apis: [
		"./src/infrastructure/webserver/routes/*.ts",
        "./src/infrastructure/webserver/docs/routes/*.ts",
        
        //uno por uno para test, test completo depsues lo borro
		// "./src/infrastructure/webserver/docs/routes/authRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/budgetRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/calculationRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/materialRequestRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/materialRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/notificationRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/orderRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/phaseRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/progressReportRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/projectDashboardRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/projectMetricsRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/taskRoutes.documented.ts",
		// "./src/infrastructure/webserver/docs/routes/templateImportExportRoutes.documented.ts",
		"./src/infrastructure/webserver/controllers/*.ts",
		"./src/domain/models/**/*.ts",
	],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

/**
 * Configure Swagger middleware
 */
export const setupSwagger = (app: Express): void => {
	// Serve swagger docs
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

	// Serve swagger spec as JSON
	app.get("/api-docs.json", (req, res) => {
		res.setHeader("Content-Type", "application/json");
		res.send(swaggerSpec);
	});

	console.log("Swagger documentation initialized");
};
