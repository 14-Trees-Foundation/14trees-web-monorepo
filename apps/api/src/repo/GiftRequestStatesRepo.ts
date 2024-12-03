import { GiftRequestState, GiftRequestStateAttributes, GiftRequestStateCreationAttributes } from "../models/gift_request_state";

export class GiftRequestStatesRepository {

    public static async getGiftRequestStates(giftRequestId: number): Promise<GiftRequestState[]> {
        return await GiftRequestState.findAll({ 
            where: { gift_request_id: giftRequestId },
            order: [['id', 'ASC']]
         });
    }

    public static async addGiftRequestState(gift_request_id: number, status: string, data: any): Promise<GiftRequestState> {
        const request: GiftRequestStateCreationAttributes = {
            status: status,
            gift_request_id: gift_request_id,
            data: data,
            created_at: new Date(),
            updated_at: new Date(),
        }

        return await GiftRequestState.create(request);
    }

    public static async updateGiftRequestState(data: GiftRequestStateAttributes): Promise<GiftRequestState> {
        const state = await GiftRequestState.findByPk(data.id);
        if (!state) {
            throw new Error("Gift Request State not found")
        }

        data.updated_at = new Date();
        return await state.update(data);
    }

    public static async deleteGiftRequestState(id: number): Promise<number> {
        const resp = await GiftRequestState.destroy({ where: { id: id } });
        return resp;
    }

}