export type Group = {
    key: number,
    id: number,
    name: string,
    type: string,
    description: string,
    logo_url: string | null,
    address: string | null,
    created_at: Date,
    updated_at: Date,
    sponsored_trees?: number,
}