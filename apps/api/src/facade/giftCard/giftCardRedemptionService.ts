import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { UserRepository } from "../../repo/userRepo";
import TreeRepository from "../../repo/treeRepo";
import { AlbumRepository } from "../../repo/albumRepo";
import { GRTransactionsRepository } from "../../repo/giftRedeemTransactionsRepo";
import { GiftCard } from "../../models/gift_card";
import { GiftRequestUser } from "../../models/gift_request_user";
import { GiftRedeemTransactionCreationAttributes } from "../../models/gift_redeem_transaction";
import { Op } from "sequelize";
import { FilterItem } from "../../models/pagination";
import { defaultGiftMessages } from "../../controllers/helper/giftRequestHelper";
import GiftRequestHelper from "../../helpers/giftRequests";

export class GiftCardRedemptionService {
    /**
     * Redeem a single gift card for a user
     */
    static async redeemSingleGiftCard(
        giftCard: GiftCard, 
        userId: number, 
        eventType?: string, 
        eventName?: string, 
        giftedBy?: string, 
        giftedOn?: string, 
        profileImageUrl?: string
    ) {
        let giftRequestUser: GiftRequestUser | null = null;
        const giftCardUsers = await GiftCardsRepository.getGiftRequestUsersByQuery({ 
            gift_request_id: giftCard.gift_card_request_id, 
            assignee: userId 
        });
        
        if (giftCardUsers.length > 0) {
            giftRequestUser = giftCardUsers[0];
        } else {
            const resp = await GiftCardsRepository.addGiftRequestUsers([{
                gift_request_id: giftCard.gift_card_request_id,
                gifted_trees: 1,
                assignee: userId,
                recipient: userId,
                profile_image_url: profileImageUrl,
                created_at: new Date(),
                updated_at: new Date()
            }], true);
            if (resp && resp.length === 1) giftRequestUser = resp[0];
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCard.gift_card_request_id }
        ]);
        const giftCardRequest = resp.results[0];

        let memoryImageUrls: string[] | null = null;
        if (giftCardRequest.album_id) {
            const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
            if (albums.length === 1) memoryImageUrls = albums[0].images;
        }

        const treeUpdateRequest = {
            assigned_at: giftedOn ? giftedOn : giftCardRequest.gifted_on,
            assigned_to: userId,
            gifted_to: userId,
            event_type: eventType?.trim() ? eventType.trim() : giftCardRequest.event_type,
            description: eventName?.trim() ? eventName.trim() : giftCardRequest.event_name,
            gifted_by_name: giftedBy?.trim() ? giftedBy.trim() : giftCardRequest.planted_by,
            updated_at: new Date(),
            planted_by: null,
            gifted_by: giftCardRequest.user_id,
            memory_images: memoryImageUrls,
            user_tree_image: profileImageUrl,
        };

        const updatedCount = await TreeRepository.updateTrees(treeUpdateRequest, { id: giftCard.tree_id });
        if (!updatedCount) {
            return;
        }

        giftCard.assigned_to = userId;
        giftCard.gifted_to = userId;
        giftCard.gift_request_user_id = giftRequestUser ? giftRequestUser.id : null;
        giftCard.updated_at = new Date();
        await giftCard.save();
    }

    /**
     * Create transaction data for gift card redemption
     */
    static createTransactionData(
        sponsorGroup: number | undefined,
        sponsorUser: number | undefined,
        requestingUser: number,
        userId: number,
        eventName: string | undefined,
        eventType: string | undefined,
        giftedBy: string | undefined,
        giftedOn: string | undefined,
        primaryMessage: string | undefined,
        secondaryMessage: string | undefined,
        logoMessage: string | undefined
    ): GiftRedeemTransactionCreationAttributes {
        return {
            group_id: sponsorGroup ?? null,
            user_id: sponsorUser ?? null,
            created_by: requestingUser,
            modified_by: requestingUser,
            recipient: userId,
            occasion_name: eventName ?? null,
            occasion_type: eventType ?? null,
            gifted_by: giftedBy ?? null,
            gifted_on: giftedOn ? new Date(giftedOn) : new Date(),
            primary_message: primaryMessage || defaultGiftMessages.primary,
            secondary_message: secondaryMessage || defaultGiftMessages.secondary,
            logo_message: logoMessage || defaultGiftMessages.logo,
            created_at: new Date(),
            updated_at: new Date(),
        };
    }

    /**
     * Redeem multiple gift cards for a single user
     */
    static async redeemMultipleGiftCard(data: {
        treesCount: number;
        sponsorGroup?: number;
        sponsorUser?: number;
        eventType?: string;
        eventName?: string;
        giftedOn?: string;
        giftedBy?: string;
        primaryMessage?: string;
        secondaryMessage?: string;
        logoMessage?: string;
        user: any;
        profileImageUrl?: string;
        requestingUser: number;
    }) {
        const {
            treesCount,
            sponsorGroup,
            sponsorUser,
            eventType,
            eventName,
            giftedOn,
            giftedBy,
            primaryMessage,
            secondaryMessage,
            logoMessage,
            user,
            profileImageUrl,
            requestingUser,
        } = data;

        if (!user?.id && (!user?.name || !user?.email)) {
            throw new Error('Please provide valid input details!');
        }

        let userId = user?.id;
        if (!userId) {
            const usr = await UserRepository.upsertUserByEmailAndName(user);
            userId = usr.id;
        }

        let filters: FilterItem[] = [];
        if (sponsorGroup) {
            filters = [{ columnField: 'group_id', operatorValue: 'equals', value: sponsorGroup }];
        } else if (sponsorUser) {
            filters = [{ columnField: 'user_id', operatorValue: 'equals', value: sponsorUser }];
        }

        const giftRequests = await GiftCardsRepository.getGiftCardRequests(0, -1, filters);
        if (giftRequests.results.length === 0) {
            throw new Error('Tree cards request not found for the group!');
        }
        const requestIds = giftRequests.results.map(request => request.id);

        const giftCards = await GiftCardsRepository.getGiftCards(0, treesCount, { 
            gift_card_request_id: { [Op.in]: requestIds }, 
            gift_request_user_id: { [Op.is]: null } 
        });
        
        if (giftCards.results.length !== treesCount) {
            throw new Error('Enough trees are not available for your request!');
        }

        for (const card of giftCards.results) {
            await this.redeemSingleGiftCard(card, userId, eventType, eventName, giftedBy, giftedOn, profileImageUrl);
        }

        const trnData = this.createTransactionData(
            sponsorGroup,
            sponsorUser,
            requestingUser,
            userId,
            eventName,
            eventType,
            giftedBy,
            giftedOn,
            primaryMessage,
            secondaryMessage,
            logoMessage
        );

        const cardIds = giftCards.results.map(card => card.id);
        if (sponsorGroup || sponsorUser) {
            const trn = await GRTransactionsRepository.createTransaction(trnData);
            await GRTransactionsRepository.addCardsToTransaction(trn.id, cardIds);
        }

        // Generate gift card templates asynchronously
        const giftCardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'id', operatorValue: 'isAnyOf', value: cardIds }
        ]);
        
        await GiftRequestHelper.generateGiftCardTemplates(giftRequests.results[0], giftCardsResp.results, {
            primary_message: primaryMessage || defaultGiftMessages.primary,
            secondary_message: secondaryMessage || defaultGiftMessages.secondary,
            logo_message: logoMessage || defaultGiftMessages.logo,
            event_type: eventType || '',
            gifted_by: giftedBy,
        });

        return { success: true, cardIds };
    }

    /**
     * Bulk redeem gift cards for multiple users
     */
    static async bulkRedeemGiftCard(data: {
        sponsorGroup?: number;
        sponsorUser?: number;
        primaryMessage?: string;
        secondaryMessage?: string;
        logoMessage?: string;
        requestingUser: number;
        users: any[];
    }) {
        const {
            sponsorGroup,
            sponsorUser,
            primaryMessage,
            secondaryMessage,
            logoMessage,
            requestingUser,
            users,
        } = data;

        if (!users?.length) {
            throw new Error('Users are required to gift trees!');
        }

        let filters: FilterItem[] = [];
        if (sponsorGroup) {
            filters = [{ columnField: 'group_id', operatorValue: 'equals', value: sponsorGroup }];
        } else if (sponsorUser) {
            filters = [{ columnField: 'user_id', operatorValue: 'equals', value: sponsorUser }];
        }

        const giftRequests = await GiftCardsRepository.getGiftCardRequests(0, -1, filters);
        if (giftRequests.results.length === 0) {
            throw new Error('Tree cards request not found for the group!');
        }
        const requestIds = giftRequests.results.map(request => request.id);

        const requestedTrees = users.reduce((acc: number, user: any) => {
            if (user.trees_count) {
                return acc + user.trees_count;
            }
            return acc;
        }, 0);

        const giftCards = await GiftCardsRepository.getGiftCards(0, requestedTrees, { 
            gift_card_request_id: { [Op.in]: requestIds }, 
            gift_request_user_id: { [Op.is]: null } 
        });
        
        if (giftCards.results.length !== requestedTrees) {
            throw new Error('Enough trees are not available for your request!');
        }

        let idx = 0;
        for (const user of users) {
            let userId = user?.id;
            if (!userId) {
                const usr = await UserRepository.upsertUserByEmailAndName(user);
                userId = usr.id;
            }

            const cards = giftCards.results.slice(idx, idx + user.trees_count);
            idx += user.trees_count;

            const {
                event_type: eventType,
                event_name: eventName,
                gifted_on: giftedOn,
                gifted_by: giftedBy,
                profile_image_url: profileImageUrl,
            } = user;

            for (const card of cards) {
                await this.redeemSingleGiftCard(card, userId, eventType, eventName, giftedBy, giftedOn, profileImageUrl);
            }

            const trnData = this.createTransactionData(
                sponsorGroup,
                sponsorUser,
                requestingUser,
                userId,
                eventName,
                eventType,
                giftedBy,
                giftedOn,
                primaryMessage,
                secondaryMessage,
                logoMessage
            );

            const cardIds = cards.map(card => card.id);
            if (sponsorGroup || sponsorUser) {
                const trn = await GRTransactionsRepository.createTransaction(trnData);
                await GRTransactionsRepository.addCardsToTransaction(trn.id, cardIds);
            }

            const giftCardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [
                { columnField: 'id', operatorValue: 'isAnyOf', value: cardIds }
            ]);
            
            GiftRequestHelper.generateGiftCardTemplates(giftRequests.results[0], giftCardsResp.results, {
                primary_message: primaryMessage || defaultGiftMessages.primary,
                secondary_message: secondaryMessage || defaultGiftMessages.secondary,
                logo_message: logoMessage || defaultGiftMessages.logo,
                event_type: eventType || '',
                gifted_by: giftedBy,
            });
        }

        return { success: true };
    }

    /**
     * Redeem a single gift card by ID
     */
    static async redeemGiftCard(data: {
        sponsorGroup?: number;
        sponsorUser?: number;
        requestingUser: number;
        giftCardId: number;
        eventType?: string;
        eventName?: string;
        giftedOn?: string;
        giftedBy?: string;
        primaryMessage?: string;
        secondaryMessage?: string;
        logoMessage?: string;
        user: any;
        profileImageUrl?: string;
    }) {
        const {
            sponsorGroup,
            sponsorUser,
            requestingUser,
            giftCardId,
            eventType,
            eventName,
            giftedOn,
            giftedBy,
            primaryMessage,
            secondaryMessage,
            logoMessage,
            user,
            profileImageUrl
        } = data;

        if (!giftCardId || (!user?.id && (!user?.name || !user?.email))) {
            throw new Error('Please provide valid input details!');
        }

        let userId = user?.id;
        if (!userId) {
            const usr = await UserRepository.upsertUserByEmailAndName(user);
            userId = usr.id;
        }

        const giftCard = await GiftCardsRepository.getGiftCard(giftCardId);
        if (!giftCard) {
            throw new Error('Gift card not found!');
        }

        if (giftCard.gift_request_user_id) {
            throw new Error('Gift card already redeemed!');
        }

        await this.redeemSingleGiftCard(giftCard, userId, eventType, eventName, giftedBy, giftedOn, profileImageUrl);

        const trnData = this.createTransactionData(
            sponsorGroup,
            sponsorUser,
            requestingUser,
            userId,
            eventName,
            eventType,
            giftedBy,
            giftedOn,
            primaryMessage,
            secondaryMessage,
            logoMessage
        );

        const cardIds = [giftCard.id];
        if (sponsorGroup || sponsorUser) {
            const trn = await GRTransactionsRepository.createTransaction(trnData);
            await GRTransactionsRepository.addCardsToTransaction(trn.id, cardIds);
        }

        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCard.gift_card_request_id }
        ]);
        const giftCardRequest = resp.results[0];

        const giftCardsResp = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'id', operatorValue: 'isAnyOf', value: cardIds }
        ]);
        
        await GiftRequestHelper.generateGiftCardTemplates(giftCardRequest, giftCardsResp.results, {
            primary_message: primaryMessage || defaultGiftMessages.primary,
            secondary_message: secondaryMessage || defaultGiftMessages.secondary,
            logo_message: logoMessage || defaultGiftMessages.logo,
            event_type: eventType || '',
            gifted_by: giftedBy
        });

        return { success: true, cardId: giftCard.id };
    }
}