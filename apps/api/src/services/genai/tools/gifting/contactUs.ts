import { DynamicTool } from "langchain/tools";

const description = `
Provides contact information for the support team.

- For gifting-related queries, a dedicated support number is available.
- For site visit coordination, a separate contact number is provided.
- For general inquiries, use the general support number.
- Additionally, a support email is available for all types of requests.

Use this tool when the user asks for help, contact details, or support-related information.
`;

const contactUsInfo = new DynamicTool({
    name: "get_contact_info",
    description: description,
    func: async (data): Promise<string> => {
        

        return JSON.stringify({
            status: "complete",
            data: {
                "email": "contact@14trees.org",
                "phone": {
                    "Gifting related use-cases": {"Sheetal Kulkarni": "+91 9845805881"},
                    "Site visit related use-cases": {"Anita Marathe": "+91 9096531278"},
                    "General Queries": {"Anita Marathe": "+91 9096531278"},
                }
            },
        });
    }

})

export default contactUsInfo;