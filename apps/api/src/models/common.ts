
export type Boundaries = {
    type: string,
    coordinates: number[][][],
}

export type Center = { 
    type: string,
    coordinates: number[],
}

export type SortOrder = { 
    column: string, 
    order: "ASC" | "DESC" 
}

export type LandCategory = 'Foundation' | 'Public';
export const LandCategory_FOUNDATION: LandCategory = 'Foundation';
export const LandCategory_PUBLIC: LandCategory = 'Public';