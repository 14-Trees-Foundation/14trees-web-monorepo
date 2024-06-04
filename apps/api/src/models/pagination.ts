
export interface PaginatedResponse<T> {
    total: number,
    offset: number,
    results: T[];
}