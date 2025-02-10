import { StructuredToolInterface } from "@langchain/core/tools";
import createGiftTreesRequestTool from "./createGiftRequest";
import getTreeCards from "./getGiftCards";
import sendRecipientsEmail from "./sendEmailToRecipeitns";
import listGiftTreesRequests from "./listPreviousRequests";

// Function to get tools
export function getGiftingTools(): StructuredToolInterface[] {

    return [createGiftTreesRequestTool, getTreeCards, sendRecipientsEmail, listGiftTreesRequests];
}
