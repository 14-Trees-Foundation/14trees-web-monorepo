import { StructuredToolInterface } from "@langchain/core/tools";
import createGiftTreesRequestTool from "./createGiftRequest";
import getTreeCards from "./getGiftCards";
import sendRecipientsEmail from "./sendEmailToRecipeitns";
import listGiftTreesRequests from "./listPreviousRequests";
import createCorporateGiftTreesRequestTool from "./createCorporateGiftRequest";
import contactUsInfo from "./contactUs";

// Function to get tools
export function getGiftingTools(): StructuredToolInterface[] {

    return [createGiftTreesRequestTool, getTreeCards, sendRecipientsEmail, listGiftTreesRequests, contactUsInfo];
}


export function getCorporateGiftingTools(): StructuredToolInterface[] {

    return [createCorporateGiftTreesRequestTool, getTreeCards, sendRecipientsEmail, listGiftTreesRequests];
}