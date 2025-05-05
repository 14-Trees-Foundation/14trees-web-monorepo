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
    description: `
[Internal Use Only] Returns today's date in YYYY-MM-DD format.
This tool should only be invoked internally when date information is required during reasoning or tool input preparation.
`,
    func: async () => getTodaysDate(),
});