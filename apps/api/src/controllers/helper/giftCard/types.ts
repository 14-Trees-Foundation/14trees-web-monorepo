import { Request, Response } from "express";
import { GiftCardRequestCreationAttributes, GiftCardRequestStatus, SponsorshipType } from "../../../models/gift_card_request";
import { GiftRequestUserInput } from "../../../models/gift_request_user";

export interface GiftCardControllerRequest extends Request {
    files?: {
        logo?: Express.Multer.File[];
        csv_file?: Express.Multer.File[];
    };
}

export interface CreateGiftCardRequestBody {
    user_id: number;
    sponsor_id?: number;
    group_id?: number;
    no_of_cards: number;
    primary_message?: string;
    secondary_message?: string;
    event_name?: string;
    event_type?: string;
    category: string;
    grove?: string;
    planted_by?: string;
    logo_message?: string;
    request_id: string;
    notes?: string;
    payment_id?: number;
    created_by?: number;
    gifted_on?: Date;
    request_type?: string;
    logo_url?: string;
    tags?: string[];
    rfr?: string;
    c_key?: string;
}

export interface PaymentSuccessBody {
    gift_request_id: number;
    remaining_trees?: number;
    is_corporate?: boolean;
}

export interface BookTreesBody {
    gift_card_request_id: number;
    gift_card_trees: any[];
    diversify?: boolean;
    book_non_giftable?: boolean;
    book_all_habits?: boolean;
}

export interface UpsertUsersBody {
    gift_card_request_id: number;
    users: GiftRequestUserInput[];
}

export interface RedeemGiftCardBody {
    gift_card_ids: number[];
    user_id?: number;
    redeemer_name?: string;
    redeemer_phone?: string;
    redeemer_email?: string;
}

export interface EmailRequestBody {
    gift_card_request_id: number;
    template_name?: string;
    attach_card?: boolean;
    cc_mails?: string[];
    test_mails?: string[];
    subject?: string;
}

export interface GiftCardResponse {
    success: boolean;
    data?: any;
    message?: string;
    error?: any;
}