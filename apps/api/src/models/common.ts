
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