import { DynamicTool } from "langchain/tools";

const description = `
Get the contact info of the support team.
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