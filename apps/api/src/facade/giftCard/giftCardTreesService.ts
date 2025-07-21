import { GiftCardRequest, GiftCardRequestStatus } from "../../models/gift_card_request";
import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import TreeRepository from "../../repo/treeRepo";
import { UserGroupRepository } from "../../repo/userGroupRepo";
import { GRTransactionsRepository } from "../../repo/giftRedeemTransactionsRepo";
import { Op } from "sequelize";

class GiftCardTreesService {
    
    public static async createGiftCardPlots(giftCardRequestId: number, plotIds: number[]) {
        return await GiftCardsRepository.addGiftCardPlots(giftCardRequestId, plotIds);
    }

    public static async getGiftCardPlots(giftCardRequestId: number) {
        return await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
    }

    public static async getBookedTrees(offset: number, limit: number, giftCardRequestId: number) {
        return await GiftCardsRepository.getBookedTrees(offset, limit, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
    }

    public static async bookTreesForGiftRequest(
        giftCardRequestId: number, 
        trees?: any[], 
        diversify?: boolean, 
        bookNonGiftable?: boolean, 
        bookAllHabits?: boolean,
        userId?: number
    ) {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        const giftCardRequest = resp.results[0];

        if (!giftCardRequest) {
            throw new Error('Gift card request not found');
        }

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        
        if (plotIds.length === 0) {
            throw new Error('Please assign plot to this request first!');
        }

        let treeIds: number[] = [];
        const treesCount = giftCardRequest.no_of_cards - Number((giftCardRequest as any).booked);
        
        if (!trees || trees.length === 0) {
            treeIds = await TreeRepository.mapTreesInPlotToUserAndGroup(
                giftCardRequest.user_id, 
                giftCardRequest.sponsor_id, 
                giftCardRequest.group_id, 
                plotIds, 
                treesCount, 
                bookNonGiftable, 
                diversify, 
                bookAllHabits
            );
            
            if (treeIds.length === 0) {
                throw new Error('Enough trees not available for this request!');
            }
        } else {
            treeIds = trees.map((item: any) => item.tree_id);
            const giftCards = await GiftCardsRepository.getGiftCards(0, -1, { 
                tree_id: { [Op.in]: treeIds } 
            });
            
            if (giftCards.results.some(card => card.gift_card_request_id !== giftCardRequestId)) {
                throw new Error('Some trees are already assigned to other gift card request!');
            }
            
            await TreeRepository.mapTreesToUserAndGroup(
                giftCardRequest.user_id, 
                giftCardRequest.sponsor_id, 
                giftCardRequest.group_id, 
                treeIds
            );
        }

        // add user to donations group
        if (treeIds.length > 0) {
            await UserGroupRepository.addUserToDonorGroup(giftCardRequest.user_id);
        }
        
        await GiftCardsRepository.bookGiftCards(giftCardRequestId, treeIds);

        const cards = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        const finalTreeIds = cards.results.filter(card => card.tree_id).map(card => card.tree_id);

        if (finalTreeIds.length === giftCardRequest.no_of_cards) {
            giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
        }

        giftCardRequest.is_active = true;
        giftCardRequest.updated_at = new Date();
        const updatedRequest = await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);

        // Update processed_by if user provided
        if (!updatedRequest.processed_by && userId && !isNaN(userId)) {
            await GiftCardsRepository.updateGiftCardRequests(
                { processed_by: userId }, 
                { id: updatedRequest.id, processed_by: { [Op.is]: null } }
            );
        }

        return updatedRequest;
    }

    public static async bookGiftCardTrees(
        giftCardRequestId: number, 
        giftCardTrees?: any[], 
        diversify?: boolean, 
        bookNonGiftable?: boolean
    ) {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        const giftCardRequest = resp.results[0];

        if (!giftCardRequest) {
            throw new Error('Gift card request not found');
        }

        const giftCardPlotMapping = await GiftCardsRepository.getGiftCardPlots(giftCardRequestId);
        const plotIds = giftCardPlotMapping.map(plot => plot.plot_id);
        
        if (plotIds.length === 0) {
            throw new Error('Please assign plot to this request first!');
        }

        let addUserToDonorGroup = false;
        
        if (giftCardTrees && giftCardTrees.length) {
            const treeIds: number[] = giftCardTrees.map((item: any) => item.tree_id);
            await TreeRepository.mapTreesToUserAndGroup(
                giftCardRequest.user_id, 
                giftCardRequest.sponsor_id, 
                giftCardRequest.group_id, 
                treeIds
            );

            const bookTreeIds: number[] = [];
            for (const item of giftCardTrees) {
                if (item.id) {
                    await GiftCardsRepository.updateGiftCards(
                        { tree_id: item.tree_id, updated_at: new Date() }, 
                        { id: item.id }
                    );
                } else {
                    bookTreeIds.push(item.tree_id);
                }
            }

            if (bookTreeIds.length > 0) {
                await GiftCardsRepository.bookGiftCards(giftCardRequestId, bookTreeIds);
                addUserToDonorGroup = true;
            }
        }

        if (addUserToDonorGroup) {
            await UserGroupRepository.addUserToDonorGroup(giftCardRequest.user_id);
        }

        const cards = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }
        ]);
        const finalTreeIds = cards.results.filter(card => card.tree_id).map(card => card.tree_id);

        if (finalTreeIds.length === giftCardRequest.no_of_cards) {
            giftCardRequest.status = GiftCardRequestStatus.pendingAssignment;
        }

        giftCardRequest.is_active = true;
        giftCardRequest.updated_at = new Date();
        return await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
    }

    public static async unBookTrees(giftCardRequestId: number, treeIds?: number[], unmapAll?: boolean) {
        let finalTreeIds: number[] = treeIds ? treeIds : [];
        let gcIds: number[] = [];
        
        if (unmapAll) {
            const bookedTreesResp = await GiftCardsRepository.getBookedTrees(0, -1, [
                { columnField: 'gift_card_request_id', operatorValue: 'equals', value: giftCardRequestId }
            ]);
            finalTreeIds = bookedTreesResp.results.filter(card => card.tree_id).map(card => card.tree_id);
            gcIds = bookedTreesResp.results.filter(card => card.tree_id).map(card => card.id);
        } else if (finalTreeIds.length > 0) {
            const bookedTreesResp = await GiftCardsRepository.getBookedTrees(0, -1, [
                { columnField: 'tree_id', operatorValue: 'isAnyOf', value: finalTreeIds }
            ]);
            finalTreeIds = bookedTreesResp.results.filter(card => card.tree_id).map(card => card.tree_id);
            gcIds = bookedTreesResp.results.filter(card => card.tree_id).map(card => card.id);
        }

        if (finalTreeIds.length > 0) {
            const updateConfig = {
                mapped_to_user: null,
                mapped_to_group: null,
                mapped_at: null,
                sponsored_by_user: null,
                sponsored_by_group: null,
                sponsored_at: new Date(),
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
                visit_id: null,
                updated_at: new Date(),
            };

            await TreeRepository.updateTrees(updateConfig, { id: { [Op.in]: finalTreeIds } });
            await GRTransactionsRepository.deleteCardsFromTransaction(gcIds);
            await GiftCardsRepository.deleteGiftCards({ 
                gift_card_request_id: giftCardRequestId, 
                tree_id: { [Op.in]: finalTreeIds } 
            });

            // TODO: This will be implemented when we extract the service logic
            // const { getGiftCardsRequest, reconcileGiftTransactions } = await import('../giftCardsService');
            // const giftCardRequest = await getGiftCardsRequest(giftCardRequestId);
            // await reconcileGiftTransactions(giftCardRequest);
            console.log('reconcileGiftTransactions - TODO: Implement this function');
        }

        // delete gift request plots
        await GiftCardsRepository.deleteGiftCardRequestPlots({ gift_card_request_id: giftCardRequestId });

        // update gift request status to pending plot selection
        await GiftCardsRepository.updateGiftCardRequests({
            status: GiftCardRequestStatus.pendingPlotSelection,
            is_active: false,
            updated_at: new Date()
        }, { id: giftCardRequestId });
    }

    public static async getTreesCountForAutoReserveTrees(giftCardRequestId: number) {
        // TODO: This method will be implemented when we extract the auto-processing logic
        // const { getPlotTreesCntForAutoReserveTreesForGiftRequest } = await import('../giftCardsService');
        // return await getPlotTreesCntForAutoReserveTreesForGiftRequest(giftCardRequestId);
        console.log('getTreesCountForAutoReserveTrees - TODO: Implement this function');
        return Promise.resolve({ available: 0, required: 0 });
    }

    public static async autoBookTreesForGiftRequest(giftCardRequestId: number) {
        // TODO: This method will be implemented when we extract the auto-processing logic
        // const { autoBookTreesForGiftRequest } = await import('../giftCardsService');
        // return await autoBookTreesForGiftRequest(giftCardRequestId);
        console.log('autoBookTreesForGiftRequest - TODO: Implement this function');
        return Promise.resolve();
    }
}

export default GiftCardTreesService;