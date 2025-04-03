import axios, { AxiosInstance } from 'axios';
import { PaginatedResponse } from '../types/pagination';

interface Plot {
  id: string;
  name: string;
  total: number;
  available: number;
  location?: string;
}

interface PaginatedPlots {
  offset: number;
  total: number;
  results: Plot[];
}

interface PlotReservation {
  plotId: string;
  trees: number;
}

class ApiClient {
  private api: AxiosInstance;
  private token: string | null;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

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

  // Existing methods
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

  async uploadUserImage(file: File, folder: string = 'user-uploads'): Promise<string> {
    try {
      const key = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      const presignedUrl = await this.getSignedPutUrl('user-avatars', key);
      
      await axios.put(presignedUrl, file, {
        headers: { 
          'Content-Type': file.type,
          'x-amz-acl': 'public-read' 
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

  async uploadUserImages(files: File[], folder: string = 'user-uploads'): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadUserImage(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch upload failed:', error);
      throw new Error('Failed to upload one or more images');
    }
  }

  // Corrected plot-related methods
  async getPlots(
    offset: number,
    limit: number,
    filters: any[] = [],
    orderBy: any[] = []
  ): Promise<PaginatedResponse<Plot>> {
    try {
      // 1. EXACT MATCH to React implementation
      const url = `/plots/get?offset=${offset}&limit=${limit}`;
      
      // 2. Same request body structure
      const response = await this.api.post<PaginatedResponse<Plot>>(url, {
        filters,
        order_by: orderBy // Matches your React 'orderBy' param name
      });
      return {
        offset: response.data.offset || offset,
        total: response.data.total,
        results: response.data.results.map(plot => ({
          id: plot.id,
          name: plot.name,
          total: plot.total,
          available: plot.available,
          location: plot.location
          // Add other mappings from your React version
        }))
      };
    } catch (error: any) {
      console.error('API Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch plots');
    }
  }

  /**
   * Get reserved trees for a donation
   */
 
}

export const apiClient = new ApiClient();