import { StructuredToolInterface } from "@langchain/core/tools";
import createGiftTreesRequestTool from "./createGiftRequest";
import getTreeCards from "./getGiftCards";
import sendRecipientsEmail from "./sendEmailToRecipients";
import listGiftTreesRequests from "./listPreviousRequests";
import createCorporateGiftTreesRequestTool from "./createCorporateGiftRequest";
import contactUsInfo from "./contactUs";
import getAvailableGiftTreesCount from "./getAvailableGiftTreesCount";
import listPreviousTransactions from "./listPreviousGiftedTrees";
import updateGiftRequest from "./updateGiftRequest";
import listGiftRequestRecipients from "./listGiftRequestRecipients";
import updateGiftRequestRecipients from "./updateGiftRequestRecipients";

// Function to get tools
export function getGiftingTools(): StructuredToolInterface[] {
    return [createGiftTreesRequestTool, getTreeCards, sendRecipientsEmail, listGiftTreesRequests, listGiftRequestRecipients, updateGiftRequest, updateGiftRequestRecipients, contactUsInfo];
}


export function getCorporateGiftingTools(): StructuredToolInterface[] {
    return [createCorporateGiftTreesRequestTool, getTreeCards, sendRecipientsEmail, listGiftTreesRequests];
}

export function getPrePurchasedGiftingTools(): StructuredToolInterface[] {
    return [getAvailableGiftTreesCount, listPreviousTransactions];
}