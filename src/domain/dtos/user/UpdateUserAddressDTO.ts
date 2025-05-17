export interface UpdateUserAddressDTO {
	street: string;
	number?: string;
	city: string;
	province: string;
	postalCode: string;
	country: string;
	reference?: string;
	isMain?: boolean;
}
