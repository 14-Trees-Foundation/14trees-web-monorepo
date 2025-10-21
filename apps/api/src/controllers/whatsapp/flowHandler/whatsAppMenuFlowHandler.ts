import { GoogleSpreadsheet } from "../../../services/google";
import { logResponseError } from "../../../services/whatsapp/logResponseError";
import { interactiveMenuFormResponse } from "../../../services/whatsapp/messages";
import { sendWhatsAppMessage } from "../../../services/whatsapp/messageHelper";
import { WHATSAPP_SCREENS } from "../whatsAppConstants";
import { WhatsAppDecryptedBody, WhatsAppFlowPayload } from "../whatsAppFlowTypes";

const menuScreens = Object.values(WHATSAPP_SCREENS.MENU_FLOW);

function isMenuScreen(screen?: string): screen is typeof menuScreens[number] {
    return !!screen && menuScreens.includes(screen as typeof menuScreens[number]);
}

export async function handleMenuFlowExchange(payload: WhatsAppFlowPayload, decryptedBody: WhatsAppDecryptedBody): Promise<boolean> {
    const selection = decryptedBody.data?.user_action_selection;

    switch (selection) {
        case 'Add_Expense': {
            delete (payload as { screen?: string }).screen;
            try {
                const replyMessage = { ...interactiveMenuFormResponse };
                replyMessage.to = "917829723729";
                await sendWhatsAppMessage(replyMessage);
            } catch (error) {
                logResponseError(error);
            }
            return true;
        }
        case 'Register_for_Site_Visit':
        case 'Site_Visit_Feedback': {
            payload.screen = WHATSAPP_SCREENS.EXPENSE_FLOW.EXPENSE_SUMMARY;
            return true;
        }
        default:
            return false;
    }
}