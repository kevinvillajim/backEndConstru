// src/domain/services/TwoFactorAuthService.ts
import {authenticator} from "otplib";
import {customAlphabet} from "nanoid";
import QRCode from "qrcode";

export class TwoFactorAuthService {
	private appName: string;
	private issuer: string;

	constructor() {
		this.appName = process.env.APP_NAME || "CONSTRU";
		this.issuer = process.env.APP_ISSUER || "CONSTRU App";

		// Configure TOTP options
		authenticator.options = {
			digits: 6,
			step: 30, // 30 seconds validity
			window: 1, // Allow 1 step before/after for clock skew
		};
	}

	/**
	 * Generate a random secret for TOTP
	 */
	generateSecret(): string {
		return authenticator.generateSecret();
	}

	/**
	 * Generate QR code URL for TOTP app
	 */
	async generateQRCode(email: string, secret: string): Promise<string> {
		const otpauth = authenticator.keyuri(email, this.appName, secret);
		try {
			return await QRCode.toDataURL(otpauth);
		} catch (error) {
			console.error("Error generating QR code:", error);
			throw new Error("Error generating QR code");
		}
	}

	/**
	 * Verify a TOTP token
	 */
	verifyToken(token: string, secret: string): boolean {
		try {
			return authenticator.verify({token, secret});
		} catch (error) {
			console.error("Error verifying token:", error);
			return false;
		}
	}

	/**
	 * Generate recovery codes
	 */
	generateRecoveryCodes(count: number = 10): string[] {
		const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 10);
		const codes: string[] = [];

		for (let i = 0; i < count; i++) {
			// Format like: ABCD-EFGH-IJKL
			const code = `${nanoid(4)}-${nanoid(4)}-${nanoid(4)}`;
			codes.push(code);
		}

		return codes;
	}

	/**
	 * Verify a recovery code - this would check against the user's saved recovery codes
	 */
	verifyRecoveryCode(code: string, savedCodes: string[]): boolean {
		const normalizedCode = code.toUpperCase().replace(/\s/g, "");
		const index = savedCodes.findIndex(
			(c) => c.replace(/-/g, "") === normalizedCode.replace(/-/g, "")
		);

		return index !== -1;
	}

	/**
	 * Remove a used recovery code from the list
	 */
	removeRecoveryCode(code: string, savedCodes: string[]): string[] {
		const normalizedCode = code.toUpperCase().replace(/\s/g, "");
		return savedCodes.filter(
			(c) => c.replace(/-/g, "") !== normalizedCode.replace(/-/g, "")
		);
	}
}
