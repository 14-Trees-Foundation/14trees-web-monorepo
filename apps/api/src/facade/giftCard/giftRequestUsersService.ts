import { GiftCardRequest } from "../../models/gift_card_request";
import { GiftRequestUserInput, GiftRequestUserCreationAttributes, GiftRequestUserAttributes } from "../../models/gift_request_user";
import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { UserRepository } from "../../repo/userRepo";
import { UserRelationRepository } from "../../repo/userRelationsRepo";
import TreeRepository from "../../repo/treeRepo";
import { Op } from "sequelize";

class GiftRequestUsersService {
    
    public static async getGiftRequestUsers(giftCardRequestId: number) {
        return await GiftCardsRepository.getGiftRequestUsers(giftCardRequestId);
    }

    public static async upsertGiftRequestUsers(giftCardRequest: GiftCardRequest, users: GiftRequestUserInput[]) {
        // TODO: This method will be implemented by extracting the logic from the original service
        // const { upsertGiftRequestUsers } = await import('../giftCardsService');
        // return await upsertGiftRequestUsers(giftCardRequest, users);
        console.log('upsertGiftRequestUsers - TODO: Implement this function');
        return Promise.resolve();
    }

    public static async updateGiftCardUserDetails(users: any[]): Promise<{ failureCount: number }> {
        let failureCount = 0;

        if (!users || users.length === 0) {
            throw new Error("Invalid request - no users provided");
        }

        const resp = await GiftCardsRepository.getBookedTrees(0, -1, [
            { columnField: 'gift_card_request_id', operatorValue: 'equals', value: users[0].gift_request_id }
        ]);
        const giftCards = resp.results;

        for (const user of users) {
            try {
                // Update recipient user details
                const recipientUpdateRequest: any = {
                    id: user.recipient,
                    name: user.recipient_name,
                    email: user.recipient_email,
                    phone: user.recipient_phone,
                };
                await UserRepository.updateUser(recipientUpdateRequest);

                // Update assignee user details if different from recipient
                if (user.assignee !== user.recipient) {
                    const assigneeUpdateRequest: any = {
                        id: user.assignee,
                        name: user.assignee_name,
                        email: user.assignee_email,
                        phone: user.assignee_phone,
                    };
                    await UserRepository.updateUser(assigneeUpdateRequest);

                    // Create user relation if specified
                    if (user.relation?.trim()) {
                        await UserRelationRepository.createUserRelation({
                            primary_user: user.recipient,
                            secondary_user: user.assignee,
                            relation: user.relation.trim(),
                            created_at: new Date(),
                            updated_at: new Date(),
                        });
                    }
                }

                // Update gift request user details
                const updateFields = {
                    ...user,
                    profile_image_url: user.profile_image_url || null,
                    updated_at: new Date(),
                };
                await GiftCardsRepository.updateGiftRequestUsers(updateFields, { id: user.id });

                // Update tree details
                const treeIds = giftCards
                    .filter(card => card.gift_request_user_id === user.id)
                    .map(card => card.tree_id);

                const updateTree = {
                    user_tree_image: user.profile_image_url || null,
                    updated_at: new Date()
                };
                
                if (treeIds.length > 0) {
                    await TreeRepository.updateTrees(updateTree, { 
                        id: { [Op.in]: treeIds }, 
                        assigned_to: user.assignee 
                    });
                }

            } catch (error: any) {
                console.log("[ERROR]", "GiftRequestUsersService::updateGiftCardUserDetails", user, error);
                failureCount++;
            }
        }

        return { failureCount };
    }

    public static async getGiftRequestUsersByQuery(query: any) {
        return await GiftCardsRepository.getGiftRequestUsersByQuery(query);
    }
}

export default GiftRequestUsersService;