export interface UpdateUserProfessionalInfoDTO {
	professionalType?: string;
	company?: {
		address: { street: string; number: string; city: string; province: string; postalCode: string; country: string; };
		yearFounded: number;
		employees: number;
		email: string;
		phone: string;
		name: string;
		position?: string;
		taxId?: string;
		website?: string;
	};
	licenseNumber?: string;
	yearsOfExperience?: number;
	specializations?: string[];
	certifications?: string[];
	bio?: string;
	socialLinks?: {
		facebook?: string;
		instagram?: string;
		linkedin?: string;
		twitter?: string;
		website?: string;
	};
	educationLevel?: string;
}
