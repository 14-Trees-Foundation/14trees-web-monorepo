import { StructuredToolInterface } from "@langchain/core/tools";
import createSendImagesToUserTool from "./SendImagesToUser";

// Function to get tools
export function getWhatsAppTools(customerPhoneNumber: string): StructuredToolInterface[] {

    return [createSendImagesToUserTool(customerPhoneNumber)];
}
