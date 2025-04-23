import { DynamicTool } from "langchain/tools";


// Function to get today's date
function getTodaysDate(): string {
    return new Date().toISOString().split("T")[0];
}

/**
 * Tool to get today's date
 */
export const dateTool = new DynamicTool({
    name: "get_todays_date",
    description: "Get today's date in YYYY-MM-DD format",
    func: async () => getTodaysDate(),
});