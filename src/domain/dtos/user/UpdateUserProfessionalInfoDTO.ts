export interface UpdateUserProfessionalInfoDTO {
	professionalType?: string;
	company?: {
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
