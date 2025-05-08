// src/bootstrap.ts
import "reflect-metadata";
import {join} from "path";
import moduleAlias from "module-alias";

// Registrar los alias de ruta
moduleAlias.addAliases({
	"@domain": join(__dirname, "domain"),
	"@application": join(__dirname, "application"),
	"@infrastructure": join(__dirname, "infrastructure"),
	"@interfaces": join(__dirname, "interfaces"),
});
