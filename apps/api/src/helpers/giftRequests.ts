import { Op } from "sequelize";
import { GiftCard } from "../models/gift_card";
import { GiftCardRequestAttributes, GiftCardRequestStatus } from "../models/gift_card_request";
import { GiftRequestUser } from "../models/gift_request_user";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import TreeRepository from "../repo/treeRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";
import runWithConcurrency, { Task } from "./consurrency";


class GiftRequestHelper {

    public static async autoBookTreesForGiftRequest(giftCardRequestId: number, bookNonGiftable: boolean, diversify: boolean, bookAllHabits: boolean): Promise<string | void> {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }]);
        const giftCardRequest = resp.results[0];
        const treesCount = giftCardRequest.no_of_cards - Number((giftCardRequest as any).booked);
        if (treesCount <= 0) return;

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        if (plotIds.length === 0) {
            return 'Please assign plot to this request first!';
        }

        let treeIds: number[] = [];
        treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(giftCardRequest.user_id, giftCardRequest.group_id, plotIds, treesCount, bookNonGiftable, diversify, bookAllHabits);
        if (treeIds.length === 0) {
            return 'Enough trees not available for this request!';
        }
        

        // add user to donations group
        if (treeIds.length > 0) await UserGroupRepository.addUserToDonorGroup(giftCardRequest.user_id);
        await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);

        const cards = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }]);
        const finalTreeIds = cards.results.filter(card => card.tree_id).map(card => card.tree_id);

        if (finalTreeIds.length === giftCardRequest.no_of_cards) {
            giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
        }

        giftCardRequest.is_active = true;
        giftCardRequest.updated_at = new Date();
        await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        if (treeIds.length !== treesCount) return 'Partially reserved: Enough trees not available for this request!';
    }

    public static async autoAssignTrees(giftCardRequest: GiftCardRequestAttributes, users: GiftRequestUser[], cards: GiftCard[], memoryImageUrls: string[] | null) {
        const userTreesMap: Record<number, GiftCard[]> = {};
        for (const user of users) {
            const userCards = cards.filter(card => card.gift_request_user_id === user.id);
            userTreesMap[user.id] = userCards;
        }
    
        let idx = 0;
        for (const user of users) {
            let count = user.gifted_trees - userTreesMap[user.id].length;
    
            while (count > 0) {
                if (idx >= cards.length) break;
                if (!cards[idx].gift_request_user_id) {
                    userTreesMap[user.id].push(cards[idx]);
                    count--;
                }
    
                idx++;
            }
        }
    
        const update = async (user: GiftRequestUser, updateRequest: any, treeIds: number[]) => {
            await GiftCardsRepository.updateGiftCards({ gift_request_user_id: user.id, updated_at: new Date() }, { gift_card_request_id: giftCardRequest.id, tree_id: { [Op.in]: treeIds } });
            await TreeRepository.updateTrees(updateRequest, { id: { [Op.in]: treeIds } });
        }
    
        const normalAssignment = giftCardRequest.request_type === 'Normal Assignment'
    
        const tasks: Task<void>[] = [];
        for (const user of users) {
            const cards = userTreesMap[user.id];
            const treeIds = cards.map(card => card.tree_id);
    
            const updateRequest = {
                assigned_at: normalAssignment ? new Date() : giftCardRequest.gifted_on,
                assigned_to: user.assignee,
                gifted_to: normalAssignment ? null : user.recipient,
                updated_at: new Date(),
                description: giftCardRequest.event_name,
                event_type: giftCardRequest.event_type,
                planted_by: null,
                gifted_by: normalAssignment ? null : giftCardRequest.user_id,
                gifted_by_name: normalAssignment ? null : giftCardRequest.planted_by,
                user_tree_image: user.profile_image_url,
                memory_images: memoryImageUrls,
            }
    
            tasks.push(() => update(user, updateRequest, treeIds));
        }
    
        await runWithConcurrency(tasks, 10);
    }


    public static async deleteGiftCardRequest(giftCardRequestId: number) {

        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })
        const cardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [{ columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }]);

        const treeIds: number[] = [];
        cardsResp.results.forEach(card => {
            if (card.tree_id) treeIds.push(card.tree_id);
        })

        if (treeIds.length > 0) {
            const updateConfig = {
                mapped_to_user: null,
                mapped_to_group: null,
                mapped_at: null,
                sponsored_by_user: null,
                sponsored_by_group: null,
                gifted_to: null,
                gifted_by: null,
                gifted_by_name: null,
                assigned_to: null,
                assigned_at: null,
                memory_images: null,
                description: null,
                planted_by: null,
                user_tree_image: null,
                event_type: null,
                updated_at: new Date(),
            }

            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: treeIds } });
            await GiftCardsRepository.deleteGiftCards({ gift_card_request_id: giftCardRequestId, tree_id: { [Op.in]: treeIds } });
        }

        // delete gift request plots
        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId })

        await GiftCardsRepository.deleteGiftRequestUsers({ gift_request_id: giftCardRequestId });

        let resp = await GiftCardsRepository.deleteGiftCardRequest(giftCardRequestId);
        console.log(`Deleted Gift card with id: ${giftCardRequestId}`, resp);
    }
}

export default GiftRequestHelper;