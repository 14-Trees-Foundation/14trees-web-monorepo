import moment from "moment";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, deleteUnwantedSlides, reorderSlides } from "../controllers/helper/slides";
import { GiftCardRequest } from "../models/gift_card_request";
import PlantTypeTemplateRepository from "../repo/plantTypeTemplateRepo";
import TreeRepository from "../repo/treeRepo";
import { copyFile, GoogleSpreadsheet } from "../services/google";
import { formatNumber, numberToWords } from "../helpers/utils";
import { PaymentRepository } from "../repo/paymentsRepo";

const defaultMessage = "Dear {recipient},\n\n"
    + 'We are immensely delighted to share that a tree has been planted in your name at the 14 Trees Foundation, Pune. This tree will be nurtured in your honour, rejuvenating ecosystems, supporting biodiversity, and helping offset the harmful effects of climate change.'
    + "\n\n"
    + 'We invite you to visit 14 Trees and firsthand experience the growth and contribution of your tree towards a greener future.'


class GiftCardsService {

    public static async generateTreeCardsForSaplings(saplingIds: string[]) {

        const treesResp = await TreeRepository.getTrees(0, -1, [
            { columnField: 'sapling_id', operatorValue: 'isAnyOf', value: saplingIds }
        ]);

        const data = treesResp.results.map((tree: any) => {
            return {
                saplingId: tree.sapling_id,
                plantType: tree.plant_type,
                assignedTo: tree.assigned_to_name,
            }
        })

        if (!process.env.GIFT_CARD_PRESENTATION_ID) {
            throw new Error("Missing gift card template presentation id in ENV variables.");
        }

        const templatePresentationId: string = process.env.GIFT_CARD_PRESENTATION_ID;
        const presentationId = await copyFile(templatePresentationId, `Adhoc Gift Cards - ${new Date().toDateString()}`);

        const plantTypeTemplateIdMap: Map<string, string> = new Map();
        const plantTypeTemplates = await PlantTypeTemplateRepository.getAll();
        for (const plantTypeTemplate of plantTypeTemplates) {
            plantTypeTemplateIdMap.set(plantTypeTemplate.plant_type, plantTypeTemplate.template_id);
        }

        const templateIds: string[] = [];
        const trees: typeof data = []
        for (const tree of data) {
            const templateId = plantTypeTemplateIdMap.get(tree.plantType);
            if (!templateId) continue;

            templateIds.push(templateId);
            trees.push(tree);
        }

        const records: any[] = [];
        const slideIds: string[] = await createCopyOfTheCardTemplates(presentationId, templateIds);
        for (let i = 0; i < slideIds.length; i++) {
            const templateId = slideIds[i];
            const tree = trees[i];

            let primaryMessage = defaultMessage;
            primaryMessage = primaryMessage.replace("{recipient}", tree.assignedTo || "");
            const record = {
                slideId: templateId,
                sapling: tree.saplingId,
                message: primaryMessage,
                logo: null,
                logo_message: ""
            }

            records.push(record);
        }

        await bulkUpdateSlides(presentationId, records);
        await deleteUnwantedSlides(presentationId, slideIds);
        await reorderSlides(presentationId, slideIds);

        return presentationId;
    }

    public static async addGiftRequestToSpreadsheet(giftRequest: GiftCardRequest) {
        const sheet = new GoogleSpreadsheet();

        const sheetName = "GiftRequests"
        const spreadsheetId = process.env.GIFTING_SPREADSHEET;
        if (!spreadsheetId) {
            console.log("[WARN]", "GiftCardsService::addGiftRequestToSpreadsheet", "spreadsheet id (GIFTING_SPREADSHEET) is not present in env");
            return;
        }
        
        const headerRes = await sheet.getSpreadsheetData(spreadsheetId, `${sheetName}!1:1`);
        const headers: string[] = headerRes?.data?.values?.[0] || [];

        const totalAmount =
            (giftRequest.category === 'Public'
                ? 2000
                : 3000
            ) * giftRequest.no_of_cards;

        let panNumber = "";
        if (giftRequest.payment_id) {
            const payment = await PaymentRepository.getPayment(giftRequest.payment_id);
            if (payment?.pan_number) panNumber = payment.pan_number;
        }

        const data: any = {
            Date: moment(giftRequest.created_at).format("DD/MM/YYYY"),
            Name: (giftRequest as any).user_name,
            Email: (giftRequest as any).user_email,
            "Total Amt": formatNumber(totalAmount),
            PAN: panNumber,
            Amount: formatNumber(totalAmount),
            AmountW: numberToWords(totalAmount),
        }

        const row = headers.map((header: string) => data[header] || '');
        await sheet.insertRowData(spreadsheetId, sheetName, row);
    }
}


export default GiftCardsService;