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
