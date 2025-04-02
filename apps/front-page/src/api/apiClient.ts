import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private api: AxiosInstance;
  private token: string | null;

  constructor() {
    // Use Next.js public env variable
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Token handling (adjust based on your Next.js auth strategy)
    this.token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (this.token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
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
      // Generate unique key with timestamp and sanitized filename
      const key = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-').toLowerCase()}`;
      
      // Get presigned URL
      const presignedUrl = await this.getSignedPutUrl('user-avatars', key);
      
      // Upload file directly to S3
      await axios.put(presignedUrl, file, {
        headers: { 
          'Content-Type': file.type,
          'x-amz-acl': 'public-read' // Ensure the file is publicly accessible
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      // Return public URL
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
}

// Singleton instance (recommended for client-side usage)
export const apiClient = new ApiClient();