import { GRTransactionsRepository } from "../repo/giftRedeemTransactionsRepo";
import { UserRepository } from "../repo/userRepo";
import { GiftCardsRepository } from "../repo/giftCardsRepo";
import GiftRequestHelper from "../helpers/giftRequests";
import TreeRepository from "../repo/treeRepo";
import { Op } from "sequelize";

interface UserUpdateResult {
    updated: boolean;
    message?: string;
    updatedFields?: string[];
}

/**
 * Fetch transaction details by ID
 * @param transactionId - The ID of the transaction to retrieve
 * @returns The transaction details or null if not found
 */
export const getTransactionById = async (transactionId: number) => {
    return await GRTransactionsRepository.getDetailedTransactionById(transactionId);
};

/**
 * Update user fields from transaction data
 * @param recipientId - The recipient user ID
 * @param mask - Array of fields to update
 * @param data - Object containing the new field values
 * @returns Result of the user update operation
 */
export const updateTransactionRecipient = async (recipientId: number, mask: string[], data: any): Promise<UserUpdateResult> => {
    const userUpdateData: any = { id: recipientId };
    const userFields = ['name', 'email', 'communication_email'];
    const userFieldsToUpdate = mask.filter(field => userFields.includes(field));
    
    if (userFieldsToUpdate.length === 0) {
        return { updated: false, message: "No user fields to update" };
    }

    // Get current user data
    const userResp = await UserRepository.getUsers(0, 1, [{ 
        columnField: 'id', 
        operatorValue: 'equals', 
        value: recipientId 
    }]);

    if (userResp.results.length === 0) {
        return { updated: false, message: "User not found" };
    }

    const user = userResp.results[0];
    userUpdateData.name = user.name;
    userUpdateData.email = user.email;
    userUpdateData.communication_email = user.communication_email;

    // Update fields based on mask
    if (mask.includes('name') && data.name) {
        userUpdateData.name = data.name;
    }
    
    if (mask.includes('email') && data.email) {
        userUpdateData.email = data.email;
    }
    
    if (mask.includes('communication_email') && data.communication_email) {
        userUpdateData.communication_email = data.communication_email;
    }

    try {
        await UserRepository.updateUser(userUpdateData);
        return { updated: true, updatedFields: userFieldsToUpdate };
    } catch (error: any) {
        return { updated: false, message: error.message };
    }
};

/**
 * Update transaction fields
 * @param transactionId - The ID of the transaction to update
 * @param filteredData - Object containing the filtered fields to update
 * @returns Result of the transaction update operation
 */
export const updateTransactionFields = async (transactionId: number, filteredData: any) => {
    filteredData['updated_at'] = new Date();
    await GRTransactionsRepository.updateTransactions(filteredData, { id: transactionId });
    return { updated: true, updatedFields: Object.keys(filteredData) };
};

/**
 * Regenerate gift card templates if relevant fields are updated
 * @param transactionId - The ID of the transaction
 * @param transaction - The transaction data
 * @param mask - Array of fields that were updated
 * @returns Result of the regeneration operation
 */
export const regenerateGiftCardTemplates = async (transactionId: number, mask: string[]) => {
    const templateFields = ['primary_message', 'secondary_message', 'logo_message', 'name', 'gifted_by'];
    const shouldRegenerateTemplates = mask.some(field => templateFields.includes(field));
    
    if (!shouldRegenerateTemplates) {
        return { regenerated: false };
    }

    try {
        const transaction = await getTransactionById(transactionId);
        if (!transaction) {
            return { regenerated: false, message: "Transaction not found" };
        }

        const cardIds = await GRTransactionsRepository.getTransactionGiftCardIds(transactionId);
        if (!cardIds || cardIds.length === 0) {
            return { regenerated: false, message: "No gift cards found for this transaction" };
        }

        const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [{ 
            columnField: 'id', 
            operatorValue: 'isAnyOf', 
            value: cardIds 
        }]);

        if (giftCards.results.length === 0) {
            return { regenerated: false, message: "No gift cards found" };
        }

        const giftCardRequestId = giftCards.results[0].gift_card_request_id;
        const giftCardRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [{ 
            columnField: 'id', 
            operatorValue: 'equals', 
            value: giftCardRequestId 
        }]);

        if (giftCardRequestResp.results.length === 0) {
            return { regenerated: false, message: "Gift card request not found" };
        }

        const giftCardRequest = giftCardRequestResp.results[0];
        await GiftRequestHelper.generateGiftCardTemplates(giftCardRequest, giftCards.results, {
            primary_message: transaction.primary_message,
            secondary_message: transaction.secondary_message,
            logo_message: transaction.logo_message,
            event_type: transaction.occasion_type || '3',
            gifted_by: transaction.gifted_by || '',
        });

        return { regenerated: true };
    } catch (error: any) {
        console.log("[ERROR]", "transactionService::regenerateGiftCardTemplates", error);
        return { regenerated: false, error: error.message };
    }
};

/**
 * Update trees associated with a transaction when certain fields are changed
 * @param transactionId - The ID of the transaction
 * @param transaction - The transaction data
 * @param mask - Array of fields that were updated
 * @param data - The updated data values
 * @returns Result of the tree update operation
 */
export const updateTransactionTrees = async (transactionId: number, transaction: any, mask: string[], data: any) => {
    const treeUpdateFields = ['gifted_by', 'gifted_on', 'occasion_type', 'occasion_name', 'profile_image_url'];
    const shouldUpdateTrees = mask.some(field => treeUpdateFields.includes(field));
    
    if (!shouldUpdateTrees) {
        return { updated: false };
    }

    try {
        // Get gift card IDs for this transaction
        const cardIds = await GRTransactionsRepository.getTransactionGiftCardIds(transactionId);
        if (!cardIds || cardIds.length === 0) {
            return { updated: false, message: "No gift cards found for this transaction" };
        }

        // Get gift cards with tree IDs
        const giftCards = await GiftCardsRepository.getBookedTrees(0, -1, [{ 
            columnField: 'id', 
            operatorValue: 'isAnyOf', 
            value: cardIds 
        }]);

        if (giftCards.results.length === 0) {
            return { updated: false, message: "No gift cards found" };
        }

        // Extract tree IDs from gift cards
        const treeIds = giftCards.results
            .filter(card => card.tree_id)
            .map(card => card.tree_id);

        if (treeIds.length === 0) {
            return { updated: false, message: "No tree IDs found in gift cards" };
        }

        // Prepare tree update data
        const treeUpdateData: any = {};

        if (mask.includes('gifted_by') && data.gifted_by) {
            treeUpdateData.gifted_by_name = data.gifted_by;
        }
        
        if (mask.includes('gifted_on') && data.gifted_on) {
            treeUpdateData.assigned_at = data.gifted_on;
        }
        
        if (mask.includes('occasion_type') && data.occasion_type) {
            treeUpdateData.event_type = data.occasion_type;
        }
        
        if (mask.includes('occasion_name') && data.occasion_name) {
            treeUpdateData.description = data.occasion_name;
        }

        if (mask.includes('profile_image_url') && data.profile_image_url) {
            treeUpdateData.user_tree_image = data.profile_image_url;
        }

        // Only proceed if we have fields to update
        if (Object.keys(treeUpdateData).length === 0) {
            return { updated: false, message: "No tree fields to update" };
        }

        // Add updated_at timestamp
        treeUpdateData.updated_at = new Date();

        // Update trees
        await TreeRepository.updateTrees(treeUpdateData, { id: { [Op.in]: treeIds } });

        return { 
            updated: true,
            updatedFields: Object.keys(treeUpdateData),
            treeCount: treeIds.length
        };
    } catch (error: any) {
        console.log("[ERROR]", "transactionService::updateTransactionTrees", error);
        return { updated: false, error: error.message };
    }
};

/**
 * Process transaction update with selective field updates
 * @param transactionId - The ID of the transaction to update
 * @param mask - Array of fields to update
 * @param data - Object containing the new field values
 * @returns Result of the update operation including status and updated fields
 */
export const processTransactionUpdate = async (transactionId: number, mask: string[], data: any) => {
    // Fetch transaction details
    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
        return { success: false, message: "Transaction not found" };
    }

    const userFields = ['name', 'email', 'communication_email'];
    const hasUserFieldsToUpdate = mask.some(field => userFields.includes(field));
    let userUpdateResult: UserUpdateResult = { updated: false };

    // Update user if necessary
    if (hasUserFieldsToUpdate && transaction.recipient) {
        userUpdateResult = await updateTransactionRecipient(transaction.recipient, mask, data);
        if (!userUpdateResult.updated) {
            return { success: false, message: `Failed to update user: ${userUpdateResult.message}` };
        }
    }

    // Filter out user fields for transaction update
    const transactionFieldsToUpdate = mask.filter(field => !userFields.includes(field));
    const filteredData: any = {};
    
    for (const field of transactionFieldsToUpdate) {
        if (data.hasOwnProperty(field)) {
            filteredData[field] = data[field];
        }
    }

    // Update transaction fields
    await updateTransactionFields(transactionId, filteredData);

    // Update associated trees if needed
    const treesUpdateResult = await updateTransactionTrees(transactionId, transaction, mask, data);

    // Regenerate gift card templates if necessary
    // this is a long running operation, so we need to run it in a separate process
    regenerateGiftCardTemplates(transactionId, mask);

    return { 
        success: true, 
        updatedTransactionFields: transactionFieldsToUpdate,
        updatedUserFields: hasUserFieldsToUpdate ? userUpdateResult.updatedFields : [],
        treesUpdated: treesUpdateResult.updated ? true : false,
        treesUpdateCount: treesUpdateResult.treeCount || 0
    };
}; 