// src/application/user/UserService.ts
import {ProfessionalType, User, UserAddress, UserGender} from "../../domain/models/user/User";
import {UserRepository} from "../../domain/repositories/UserRepository";
import {UpdateUserPersonalInfoDTO} from "../../domain/dtos/user/UpdateUserPersonalInfoDTO";
import {UpdateUserProfessionalInfoDTO} from "../../domain/dtos/user/UpdateUserProfessionalInfoDTO";
import {UpdateUserPreferencesDTO} from "../../domain/dtos/user/UpdateUserPreferencesDTO";
import {UpdateUserAddressDTO} from "../../domain/dtos/user/UpdateUserAddressDTO";

export class UserService {
	private userRepository: UserRepository;

	constructor(userRepository: UserRepository) {
		this.userRepository = userRepository;
	}

	async getUserProfile(userId: string): Promise<User | null> {
		return await this.userRepository.findById(userId);
	}

	async updatePersonalInfo(
		userId: string,
		personalInfo: UpdateUserPersonalInfoDTO
	): Promise<User | null> {
		const updatedInfo: Partial<User> = {
			...personalInfo,
			gender: personalInfo.gender as UserGender,
		};
		return await this.userRepository.update(userId, updatedInfo);
	}

	async updateProfessionalInfo(
		userId: string,
		professionalInfo: UpdateUserProfessionalInfoDTO
	): Promise<User | null> {
		const updatedInfo: Partial<User> = {
			...professionalInfo,
			professionalType: professionalInfo.professionalType as ProfessionalType,
			company: professionalInfo.company
				? {
						name: professionalInfo.company.name ?? "",
						taxId: professionalInfo.company.taxId ?? "",
						address: professionalInfo.company.address ?? {
							street: "",
							number: "",
							city: "",
							province: "",
							postalCode: "",
							country: "",
						},
						phone: professionalInfo.company.phone ?? "",
						email: professionalInfo.company.email ?? "",
						website: professionalInfo.company.website,
						position: professionalInfo.company.position,
						employees: professionalInfo.company.employees,
						yearFounded: professionalInfo.company.yearFounded,
				  }
				: undefined,
		};
		return await this.userRepository.update(userId, updatedInfo);
	}

	async updatePreferences(
		userId: string,
		preferences: UpdateUserPreferencesDTO
	): Promise<User | null> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error("Usuario no encontrado");
		}

		// Ensure required properties are present
		const updatedPreferences = {
			notifications: user.preferences?.notifications || {
				email: true,
				push: true,
				sms: true,
			},
			projectUpdates: user.preferences?.projectUpdates ?? true,
			materialRecommendations:
				user.preferences?.materialRecommendations ?? true,
			pricingAlerts: user.preferences?.pricingAlerts ?? true,
			weeklyReports: user.preferences?.weeklyReports ?? true,
			languagePreference:
				preferences.language || user.preferences?.languagePreference || "es",
			...(preferences as any), // Cast to bypass strict checks
		};

		return await this.userRepository.update(userId, {
			preferences: updatedPreferences,
		});
	}

	async getUserAddresses(userId: string): Promise<UserAddress[]> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error("Usuario no encontrado");
		}

		return user.addresses || [];
	}

	async addAddress(
		userId: string,
		address: UpdateUserAddressDTO
	): Promise<UserAddress> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new Error("Usuario no encontrado");
		}

		const newAddress: UserAddress = {
			...address,
			id: uuid(), // Generate a unique ID
			number: address.number || "", // Ensure number is never undefined
			isMain: address.isMain || false,
		};

		// If this is the first address or marked as main, ensure it's the only main address
		if (newAddress.isMain || !user.addresses || user.addresses.length === 0) {
			if (user.addresses && user.addresses.length > 0) {
				// Set all existing addresses to non-main
				user.addresses = user.addresses.map((addr) => ({
					...addr,
					isMain: false,
				}));
			}

			newAddress.isMain = true;
		}

		// Add the new address
		const userAddresses = user.addresses || [];
		userAddresses.push(newAddress);

		// Update user with new addresses
		await this.userRepository.update(userId, {addresses: userAddresses});

		return newAddress;
	}

	async updateAddress(
		userId: string,
		addressId: string,
		addressData: UpdateUserAddressDTO
	): Promise<UserAddress | null> {
		const user = await this.userRepository.findById(userId);
		if (!user || !user.addresses) {
			throw new Error("Usuario o dirección no encontrada");
		}

		// Find the address to update
		const addressIndex = user.addresses.findIndex(
			(addr) => addr.id === addressId
		);
		if (addressIndex === -1) {
			throw new Error("Dirección no encontrada");
		}

		const updatedAddress: UserAddress = {
			...user.addresses[addressIndex],
			...addressData,
		};

		// If this address is being set as main, update all others
		if (updatedAddress.isMain) {
			user.addresses = user.addresses.map((addr) =>
				addr.id === addressId ? addr : {...addr, isMain: false}
			);
		}

		// Update the address in the array
		user.addresses[addressIndex] = updatedAddress;

		// Update user with modified addresses
		await this.userRepository.update(userId, {addresses: user.addresses});

		return updatedAddress;
	}

	async deleteAddress(userId: string, addressId: string): Promise<boolean> {
		const user = await this.userRepository.findById(userId);
		if (!user || !user.addresses) {
			return false;
		}

		// Find the address to delete
		const addressIndex = user.addresses.findIndex(
			(addr) => addr.id === addressId
		);
		if (addressIndex === -1) {
			return false;
		}

		// Check if we're deleting the main address
		const isMainAddress = user.addresses[addressIndex].isMain;

		// Remove the address
		user.addresses.splice(addressIndex, 1);

		// If we deleted the main address and there are other addresses, set the first one as main
		if (isMainAddress && user.addresses.length > 0) {
			user.addresses[0].isMain = true;
		}

		// Update user with modified addresses
		await this.userRepository.update(userId, {addresses: user.addresses});

		return true;
	}

	async updateProfilePicture(
		userId: string,
		picturePath: string
	): Promise<User | null> {
		return await this.userRepository.update(userId, {
			profilePicture: picturePath,
		});
	}
}
function uuid(): string {
	throw new Error("Function not implemented.");
}

