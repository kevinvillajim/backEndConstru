export interface UpdateUserPreferencesDTO {
	language?: string;
	currency?: string;
	dateFormat?: string;
	timeFormat?: string;
	distanceUnit?: "metric" | "imperial";
	accessibility?: {
		reducedMotion?: boolean;
		highContrast?: boolean;
		largeText?: boolean;
	};
}
