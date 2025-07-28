import { apiClient } from "~/api/apiClient";
import { 
  getInternalTestMetadata,
  addInternalTestTags,
  addInternalTestPrefix,
  addInternalTestComments
} from "~/utils";

export interface GiftTreesRequestData {
  request_id: string;
  user_id: number;
  sponsor_id: number;
  sponsor_name: string;
  sponsor_email: string;
  sponsor_phone: string;
  category: string;
  grove: null;
  no_of_cards: number;
  payment_id: number;
  contribution_options: any[];
  comments: string;
  primary_message: string;
  secondary_message: string;
  request_type: string;
  tags: string[];
  event_name: string | null;
  event_type: string | null;
  planted_by: string | null;
  gifted_on: Date;
  rfr: string | null;
  c_key: string | null;
  remaining_trees: number;
}

export interface GiftTreesResponse {
  id: string;
}

export interface ProcessedUser {
  recipient_name: string;
  recipient_email: string;
  recipient_communication_email?: string;
  assignee_name: string;
  assignee_email: string;
  assignee_phone?: string;
  relation: string;
  trees_count: number;
  gifted_trees: number;
}

export class GiftingService {
  static async createGiftTreesRequest(
    requestData: GiftTreesRequestData,
    totalAmount: number
  ): Promise<GiftTreesResponse> {
    try {
      const requestWithMetadata = {
        ...requestData,
        sponsor_name: addInternalTestPrefix(requestData.sponsor_name, requestData.sponsor_email),
        comments: addInternalTestComments(requestData.comments, requestData.sponsor_email),
        tags: addInternalTestTags(requestData.tags, requestData.sponsor_email),
        ...getInternalTestMetadata(requestData.sponsor_email, totalAmount),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestWithMetadata)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gift Trees Request submission failed");
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || "Failed to create gift trees request");
    }
  }

  static async createGiftCardUsers(
    giftCardRequestId: string,
    users: ProcessedUser[]
  ): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gift-cards/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gift_card_request_id: giftCardRequestId,
          users: users.map(user => ({
            ...user,
            gifted_trees: user.trees_count,
          })),
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gift Cards Users creation failed");
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to create gift card users");
    }
  }

  static async createOrGetUser(fullName: string, email: string): Promise<{ id: number }> {
    try {
      const user = await apiClient.getUser(email);
      if (!user) {
        const userData = await apiClient.createUser(fullName, email);
        return { id: userData.id };
      } else {
        return { id: user.id };
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to create or get user");
    }
  }

  static processUserData(dedicatedNames: any[], donorName: string): ProcessedUser[] {
    const donor = donorName.replaceAll(" ", "").toLocaleLowerCase();
    
    return dedicatedNames
      .filter(user => user.recipient_name.trim() !== "")
      .map(item => {
        let user = { ...item };
        
        // Set assignee data if not provided
        if (!user.assignee_name?.trim()) {
          user.assignee_name = user.recipient_name;
          user.assignee_email = user.recipient_email;
          user.assignee_phone = user.recipient_phone;
        }
        
        user.recipient_communication_email = item.recipient_communication_email || "";

        // Process recipient email
        if (user.recipient_email) {
          user.recipient_email = user.recipient_email.replace("donor", donor);
        } else {
          user.recipient_email = user.recipient_name.trim().toLowerCase().replace(/\s+/g, '.') + "." + donor + "@14trees";
        }

        // Process assignee email
        if (user.assignee_email) {
          user.assignee_email = user.assignee_email.replace("donor", donor);
        } else {
          user.assignee_email = user.assignee_name.trim().toLowerCase().replace(/\s+/g, '.') + "." + donor + "@14trees";
        }

        return user;
      });
  }

  static calculateRemainingTrees(totalTrees: number, users: ProcessedUser[]): number {
    const assignedTrees = users.reduce((sum, user) => sum + Number(user.trees_count), 0);
    return totalTrees - assignedTrees;
  }

  static async getReferralDetails(rfr: string | null, cKey: string | null): Promise<any> {
    if (!rfr && !cKey) return null;
    
    try {
      const details = await apiClient.getReferrelDetails(rfr, cKey);
      return details;
    } catch (error) {
      console.error('Failed to fetch referral details:', error);
      return null;
    }
  }
}