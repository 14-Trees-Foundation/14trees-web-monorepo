import { DynamicTool } from "langchain/tools";

const description = `
Provides support contact information based on the user's query. 
Use this tool when the user asks for help, contact details, or support-related information. 
It returns dedicated phone numbers for gifting-related queries, site visit coordination, and general inquiries, along with a support email address for all types of requests.",
`;

const contactUsInfo = new DynamicTool({
    name: "get_support_contact_info",
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