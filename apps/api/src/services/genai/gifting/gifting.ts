import { StructuredToolInterface } from "@langchain/core/tools";
import createGiftTreesRequestTool from "./createGiftRequest";
import getTreeCards from "./getGiftCards";
import sendRecipientsEmail from "./sendEmailToRecipeitns";
import listGiftTreesRequests from "./listPreviousRequests";
import createGiftTreesRequestToolV2 from "./createGiftRequestV2";

// Function to get tools
export function getGiftingTools(): StructuredToolInterface[] {

    return [createGiftTreesRequestTool, getTreeCards, sendRecipientsEmail, listGiftTreesRequests];
}


export function getCorporateGiftingTools(): StructuredToolInterface[] {

    return [createGiftTreesRequestToolV2, getTreeCards, sendRecipientsEmail, listGiftTreesRequests];
}