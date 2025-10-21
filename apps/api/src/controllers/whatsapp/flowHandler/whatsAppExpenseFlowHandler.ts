import { GoogleSpreadsheet } from "../../../services/google";
import { logResponseError } from "../../../services/whatsapp/logResponseError";
import { interactiveMenuFormResponse } from "../../../services/whatsapp/messages";
import { sendWhatsAppMessage } from "../../../services/whatsapp/messageHelper";
import { WHATSAPP_SCREENS } from "../whatsAppConstants";
import { WhatsAppDecryptedBody, WhatsAppFlowPayload } from "../whatsAppFlowTypes";

const expenseScreens = Object.values(WHATSAPP_SCREENS.EXPENSE_FLOW);

function isExpenseScreen(screen?: string): screen is typeof expenseScreens[number] {
    return !!screen && expenseScreens.includes(screen as typeof expenseScreens[number]);
}

export async function handleExpenseFlowExchange(payload: WhatsAppFlowPayload, decryptedBody: WhatsAppDecryptedBody): Promise<boolean> {
    const screen = decryptedBody.screen;
    if (!isExpenseScreen(screen)) {
        return false;
    }

    switch (screen) {
        case WHATSAPP_SCREENS.EXPENSE_FLOW.EXPENSE_FORM: {
            payload.screen = WHATSAPP_SCREENS.EXPENSE_FLOW.EXPENSE_SUMMARY;
            payload.data = decryptedBody.data ?? {};
            return true;
        }
        case WHATSAPP_SCREENS.EXPENSE_FLOW.EXPENSE_SUMMARY: {
            const expenseData = decryptedBody.data;
            console.log("Expense to be added in the system: ", expenseData);
            const spreadsheetId = process.env.EXPENSE_SPREADSHEET;
            if (!spreadsheetId) {
                console.log(
                    "[WARN]",
                    "WhatsappController::handleDataExchange",
                    "spreadsheet id (EXPENSE_SPREADSHEET) is not present in env",
                );
                return true;
            }

            try {
                const googleSheet = new GoogleSpreadsheet();
                await googleSheet.insertRowData(spreadsheetId, "expenses", [
                    new Date().toISOString().split("T")[0],
                    expenseData?.amount,
                    expenseData?.who_paid,
                    expenseData?.paid_to,
                    expenseData?.reason,
                ]);
            } catch (error) {
                console.error("[ERROR] Failed to update Google Sheet with new expense:", {
                    error,
                    stack: error instanceof Error ? error.stack : undefined,
                });
            }

            payload.screen = WHATSAPP_SCREENS.EXPENSE_FLOW.EXPENSE_SUBMITTED;
            payload.data = { response: "Thank you for submitting the expense!" };
            return true;
        }
        case WHATSAPP_SCREENS.EXPENSE_FLOW.EXPENSE_SUBMITTED: {
            return true;
        }
        default:
            return false;
    }
}