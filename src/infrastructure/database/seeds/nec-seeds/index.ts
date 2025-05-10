// src/infrastructure/database/seeds/nec-seeds/index.ts
import {seedCalculationTemplates} from "../calculation-templates";
import {seedSpecializedTemplates} from "../specialized-templates";
import {seedSeismicTemplates} from "./seismic-templates";
import {seedStructuralTemplates} from "./structural-templates";
import {seedFoundationTemplates} from "./foundation-templates";
import {seedEnergyEfficiencyTemplates} from "./energy-efficiency-templates";

export async function seedNECTemplates() {
	// Plantillas base
	await seedCalculationTemplates();
	await seedSpecializedTemplates();

	// Plantillas específicas NEC
	await seedSeismicTemplates();
	await seedStructuralTemplates();
	await seedFoundationTemplates();
	await seedEnergyEfficiencyTemplates();

	console.log("Todas las plantillas NEC han sido inicializadas correctamente");
}
