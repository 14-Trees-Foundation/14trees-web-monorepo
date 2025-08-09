import { 
  addInternalTestPrefix,
  addInternalTestComments,
  addInternalTestTags,
  getInternalTestMetadata
} from "~/utils";
import { DedicatedName, FormData } from '../types';

export interface DonationRequest {
  sponsor_name: string;
  sponsor_email: string;
  sponsor_phone: string;
  category: string;
  donation_type: "adopt" | "donate";
  donation_method?: "trees" | "amount";
  payment_id: number;
  contribution_options: string[];
  comments: string;
  amount_donated: number;
  visit_date?: string;
  trees_count?: number;
  users: DedicatedName[];
  tags: string[];
  rfr?: string | null;
  c_key?: string | null;
  [key: string]: any; // For internal test metadata
}

export interface DonationResponse {
  id: number;
  message?: string;
}

export interface UpdateDonationRequest {
  donation_id: number;
  updateFields: string[];
  data: {
    contribution_options?: string[];
    comments?: string;
  };
}

export class DonationService {
  private static processUsers(dedicatedNames: DedicatedName[], donorName: string): DedicatedName[] {
    const donor = donorName.replaceAll(" ", "").toLowerCase();
    
    return dedicatedNames.map(item => {
      let user = { ...item };
      
      // Set assignee details if not provided
      if (!user.assignee_name?.trim()) {
        user.assignee_name = user.recipient_name;
        user.assignee_email = user.recipient_email;
        user.assignee_phone = user.recipient_phone;
      }

      // Process recipient email
      if (user.recipient_email) {
        user.recipient_email = user.recipient_email.trim().replace("donor", donor);
      } else {
        user.recipient_email = user.recipient_name.toLowerCase().trim().replace(/\s+/g, '.') + "." + donor + "@14trees";
      }

      // Process assignee email
      if (user.assignee_email) {
        user.assignee_email = user.assignee_email.trim().replace("donor", donor);
      } else {
        user.assignee_email = user.assignee_name.toLowerCase().trim().replace(/\s+/g, '.') + "." + donor + "@14trees";
      }

      return user;
    });
  }

  static async createDonation(
    formData: FormData,
    dedicatedNames: DedicatedName[],
    treeLocation: "adopt" | "donate",
    donationMethod: "trees" | "amount",
    paymentId: number,
    amount: number,
    originalAmount: number,
    adoptedTreeCount: number,
    donationTreeCount: number,
    visitDate: string,
    rfr?: string | null,
    c_key?: string | null
  ): Promise<DonationResponse> {
    const processedUsers = this.processUsers(dedicatedNames, formData.fullName);
    
    // Set tree count for single entry
    if (processedUsers.length === 1 && !dedicatedNames[0].recipient_name.trim()) {
      processedUsers[0].trees_count = donationTreeCount;
    }

    const donationRequest: DonationRequest = {
      sponsor_name: addInternalTestPrefix(formData.fullName, formData.email),
      sponsor_email: formData.email,
      sponsor_phone: formData.phone,
      category: treeLocation === "adopt" ? "Foundation" : "Public",
      donation_type: treeLocation,
      donation_method: treeLocation === "donate" ? donationMethod : undefined,
      payment_id: paymentId,
      contribution_options: [],
      comments: addInternalTestComments(formData.comments, formData.email),
      amount_donated: amount,
      ...(treeLocation === "adopt" && {
        visit_date: visitDate,
        trees_count: adoptedTreeCount,
      }),
      ...(treeLocation === "donate" && {
        ...(donationMethod === "trees" && { trees_count: donationTreeCount }),
        ...(donationMethod === "amount" && { amount_donated: amount }),
      }),
      users: processedUsers,
      tags: addInternalTestTags(["WebSite"], formData.email),
      rfr,
      c_key,
      ...getInternalTestMetadata(formData.email, originalAmount),
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(donationRequest)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Donation submission failed");
      }

      const responseData = await response.json();
      return {
        id: responseData.id,
        message: responseData.message
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to create donation");
    }
  }

  static async updateDonation(request: UpdateDonationRequest): Promise<void> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/donations/requests/${request.donation_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to update donation details');
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to update donation");
    }
  }

  static calculateAmount(
    treeLocation: "adopt" | "donate",
    donationMethod: "trees" | "amount",
    adoptedTreeCount: number,
    donationTreeCount: number,
    donationAmount: number
  ): number {
    if (treeLocation === "adopt") {
      return 3000 * (adoptedTreeCount || 0);
    } else if (treeLocation === "donate") {
      return donationMethod === "trees"
        ? 1500 * (donationTreeCount || 0)
        : donationAmount;
    }
    return 0;
  }
}