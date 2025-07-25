import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private api: AxiosInstance;
  private token: string | null;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (this.token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  /**
   * Create a payment request
   * @param amount - The amount to be paid
   * @param donor_type - The tax status of the donor
   * @param pan_number - The PAN number of the donor
   * @param consent - The consent of the donor
   * @param user_email - The email of the user (for Razorpay account selection)
   * @returns Processed payment response
   */
  async createPayment(amount: number, donor_type: string | null, pan_number: string | null, consent: boolean, user_email?: string): Promise<any> {
    const response = await this.api.post('/payments', { amount, donor_type, pan_number, consent, user_email });
    return response.data;
  }

  async createPaymentHistory(payment_id: number, payment_type: string, amount: number, payment_proof: string): Promise<any> {
    const response = await this.api.post('/payments/history', { payment_id, payment_type, amount, payment_proof });
    return response.data;
  }

  /**
   * Get a presigned S3 URL for direct file uploads.
   * @param type - S3 bucket folder (e.g., "gift-request").
   * @param key - File path/key (e.g., "user-uploads/filename.jpg").
   * @returns Presigned URL string.
   */
  async getSignedPutUrl(type: string, key: string): Promise<string> {
    try {
      const response = await this.api.get<{ url: string }>(
        `/utils/signedPutUrl?type=${type}&key=${encodeURIComponent(key)}`
      );
      return response.data.url;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to generate S3 upload URL');
    }
  }

  /**
   * Upload a user image to S3 and return the public URL
   * @param file - The image file to upload
   * @param folder - Optional folder prefix (default: "user-uploads")
   * @returns Public URL of the uploaded image
   */
  async uploadUserImage(file: File, folder: string = 'user-uploads'): Promise<string> {
    try {
      const key = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;

      const presignedUrl = await this.getSignedPutUrl('user-avatars', key);

      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      return `https://14treesplants.s3.amazonaws.com/${key}`;
    } catch (error: any) {
      console.error('Image upload failed:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Upload multiple user images in parallel
   * @param files - Array of image files
   * @param folder - Optional folder prefix
   * @returns Array of public URLs in same order as input files
   */
  async uploadUserImages(files: File[], folder: string = 'user-uploads'): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadUserImage(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch upload failed:', error);
      throw new Error('Failed to upload one or more images');
    }
  }

  /**
   * Submit a donation request to the backend
   * @param data - Donation data including required fields
   * @returns Processed donation response
   * @throws Error with backend message or default failure message
   */
  async submitDonation(data: {
    request_id: string;
    user_id: string;
    category: string;
    created_by: string;
    trees_count?: number;
    pledged_area_acres?: number;
    donation_type?: string; // "adopt" or "donate"
    donation_method?: string; // "trees" or "amount"
    visit_date?: string; // Required for adoptions
    amount_donated?: number; // Required for monetary donations
    [key: string]: any; // For additional fields
  }): Promise<any> {
    try {
      // Validate required fields (client-side)
      const requiredFields = ['request_id', 'user_id', 'category', 'created_by'];
      const missingFields = requiredFields.filter(field => !data[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const response = await this.api.post('/donations/requests', data);
      return response.data;

    } catch (error: any) {
      console.error('[Donation Submission Error]', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Donation submission failed');
    }
  }

  async generateCardTemplate(request_id: string, primary_message: string, secondary_message: string, logo_message: string, logo?: string | null, sapling_id?: string | null, user_name?: string | null, plant_type?: string | null): Promise<{ presentation_id: string, slide_id: string }> {
    try {
      const resp = await this.api.post<any>(`/gift-cards/generate-template`, { request_id, primary_message, secondary_message, logo_message, logo, sapling_id, plant_type, user_name });
      return resp.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to generate gift cards');
    }
  }

  async updateGiftCardTemplate(slide_id: string, primary_message: string, secondary_message: string, logo_message: string, logo?: string | null, sapling_id?: string | null, user_name?: string | null, trees_count?: number): Promise<void> {
    try {
      await this.api.post<any>(`/gift-cards/update-template`, { slide_id, primary_message, secondary_message, logo_message, logo, sapling_id, user_name, trees_count });
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to generate gift cards');
    }
  }

  /**
   * Create a gift card request
   * @param data - Gift card request data including required fields
   * @returns Processed gift card request response
   * @throws Error with backend message or default failure message
   */
  async createGiftCardRequest(data: {
    user_id: number;
    no_of_cards: number;
    created_by?: number;
    event_name?: string | null;
    event_type?: string | null;
    gifted_on?: Date;
    planted_by?: string | null;
    [key: string]: any;
  }): Promise<any> {
    try {
      const requiredFields = ['user_id', 'no_of_cards', 'created_by'];
      const missingFields = requiredFields.filter(field => !data[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const formData = new FormData();

      Object.keys(data).forEach(key => {
        if (data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });

      const response = await this.api.post('/gift-cards/requests', formData);
      return response.data;

    } catch (error: any) {
      console.error('[Gift Card Request Error]', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'Gift card request submission failed');
    }
  }

  async getUser(email: string): Promise<any> {
    const response = await this.api.post(`${process.env.NEXT_PUBLIC_API_URL}/users/get?offset=0&limit=1`, { filters: [{ columnField: "email", operator: "equals", value: email }] });
    return response.data.results.length > 0 ? response.data.results[0] : null;
  }

  /**
   * Create a user
   * @param name - The name of the user
   * @param email - The email of the user
   * @returns Processed user response
   * @throws Error with backend message or default failure message
   */
  async createUser(name: string, email: string): Promise<any> {
    const userPayload = { name, email };

    try {
      const response = await this.api.post(`${process.env.NEXT_PUBLIC_API_URL}/users`, userPayload);
      return response.data;
    } catch (error: any) {
      console.error('[User Creation Error]', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(error.message || 'User creation failed');
    }
  }

  async uploadPaymentProof(data: {
    key: string;
    payment_proof: File;
  }): Promise<any> {
    const presignedUrl = await this.getSignedPutUrl('gift-request', data.key);
    await axios.put(presignedUrl, data.payment_proof, {
      headers: {
        'Content-Type': data.payment_proof.type,
      }
    });

    return presignedUrl.split('?')[0];
  }

  async serveUserQuery(message: string, history: any[]): Promise<{ output: string }> {
    try {
      const response = await this.api.post<{ output: string }>(`/gift-cards/gen-ai`, { message, history }, {
        headers: {
          "content-type": "application/json",
        }
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to connect with our AI bot!');
    }
  }


  async getReferral(email: string, c_key?: string | null): Promise<{ rfr: string, c_key: string }> {
    try {
      const response = await this.api.post<{ rfr: string, c_key: string }>(`/referrals/`, { email, c_key }, {
        headers: {
          "content-type": "application/json",
        }
      });
      return response.data;
    } catch(error: any) {
      if (error.response) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to general referral link!');
    }
  }

  async listCampaigns(): Promise<{ name: string, c_key: string }[]> {
    try {
      const response = await this.api.post<{ results: { name: string, c_key: string }[] }>(`/campaigns/list/get`, {
        headers: {
          "content-type": "application/json",
        }
      });
      return response.data.results;
    } catch(error: any) {
      if (error.response) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to general referral link!');
    }
  }

  async getReferrelDetails(rfr?: string | null, c_key?: string | null): Promise<{ referred_by?: string, name?: string, c_key?: string, description?: string }> {
    try {
      const response = await this.api.post<{ referred_by?: string, name?: string, c_key?: string, description?: string }>(`/referrals/details`, { rfr, c_key }, {
        headers: {
          "content-type": "application/json",
        }
      });
      return response.data;
    } catch(error: any) {
      if (error.response) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to fetch referrel details!');
    }
  }
}
export const apiClient = new ApiClient();