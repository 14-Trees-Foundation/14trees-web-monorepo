import { defaultGiftMessages } from "../controllers/helper/giftRequestHelper";
import { bulkUpdateSlides, createCopyOfTheCardTemplates, deleteUnwantedSlides, reorderSlides } from "../controllers/helper/slides";
import PlantTypeTemplateRepository from "../repo/plantTypeTemplateRepo";
import TreeRepository from "../repo/treeRepo";
import { copyFile } from "../services/google";

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

            const record = {
                slideId: templateId,
                name: tree.assignedTo || "",
                sapling: tree.saplingId,
                content1: defaultGiftMessages.primary,
                content2: defaultGiftMessages.secondary,
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
}


export default GiftCardsService;