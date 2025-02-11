import { StructuredToolInterface } from "@langchain/core/tools";
import createSendImagesToUserTool from "./SendImagesToUser";
import createSendEditRecipientsFlowTool from "./SendEditRecipientsFlow";
import createSendEditGiftMessagingFlowTool from "./SendEditGiftMsgFlow";

// Function to get tools
export function getWhatsAppTools(customerPhoneNumber: string): StructuredToolInterface[] {

    return [createSendImagesToUserTool(customerPhoneNumber), createSendEditRecipientsFlowTool(customerPhoneNumber), createSendEditGiftMessagingFlowTool(customerPhoneNumber)];
}
