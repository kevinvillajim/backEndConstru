export interface PaginationOptions {
	page?: number; // Número de página (opcional)
	limit?: number; // Cantidad de elementos por página (opcional)
	sortBy?: string; // Campo por el que ordenar (opcional)
	sortOrder?: "asc" | "desc"; // Orden ascendente o descendente (opcional)
}
