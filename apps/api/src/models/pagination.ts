
export interface PaginatedResponse<T> {
    total: number,
    offset: number,
    results: T[];
}

export interface FilterItem {
    columnField: string,
    value: string | string[],
    operatorValue: string,
}

