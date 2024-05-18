

export const convertNotionDataIntoTreeType = (notionData: [any]) => {

    return notionData.map( (item: any) => 
        ({
            name: item["Name"],
            scientific_name: "",
            tree_id: "",
            image: [],
            family: "",
            habit: "",
            remarkable_char: "",
            med_use: "",
            other_use: "",
            food: "",
            eco_value: "",
            parts_userd: "",
            tags: [""],
            desc: item["Short description"],
        }))
}