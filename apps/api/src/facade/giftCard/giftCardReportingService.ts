import { GiftCardsRepository } from "../../repo/giftCardsRepo";
import { AlbumRepository } from "../../repo/albumRepo";
import TreeRepository from "../../repo/treeRepo";
import GiftCardsService from "../giftCardsService";

/**
 * Gift Card Reporting Service
 * Handles reporting and administrative operations for gift card requests
 */
export class GiftCardReportingService {

    /**
     * Generate fund request PDF for a gift card request
     * Creates a PDF document for fund request purposes
     */
    async generateFundRequestPdf(giftCardRequestId: number): Promise<{
        pdfUrl: { location: string };
        message: string;
    }> {
        console.log('[INFO] Generating fund request PDF for gift card:', giftCardRequestId);

        try {
            const result = await GiftCardsService.generateFundRequestPdf(giftCardRequestId);
            
            console.log('[INFO] Fund request PDF generated successfully');
            return {
                pdfUrl: result.pdfUrl,
                message: 'Fund request PDF generated successfully'
            };
        } catch (error) {
            console.error('[ERROR] Failed to generate fund request PDF:', error);
            throw error;
        }
    }

    /**
     * Send fund request email with PDF attachment
     * Sends the fund request PDF via email to relevant stakeholders
     */
    async sendFundRequestEmail(giftCardRequestId: number): Promise<{
        message: string;
        pdfUrl: string;
    }> {
        console.log('[INFO] Sending fund request email for gift card:', giftCardRequestId);

        try {
            const result = await GiftCardsService.sendFundRequestEmail(giftCardRequestId);
            
            console.log('[INFO] Fund request email sent successfully');
            return {
                message: result.message,
                pdfUrl: result.pdfUrl.location
            };
        } catch (error) {
            console.error('[ERROR] Failed to send fund request email:', error);
            throw error;
        }
    }

    /**
     * Update gift card request album
     * Associates an album with a gift card request and updates memory images for trees
     */
    async updateGiftCardRequestAlbum(
        giftCardRequestId: number,
        albumId?: number
    ): Promise<void> {
        console.log('[INFO] Updating album for gift card request:', giftCardRequestId, 'Album ID:', albumId);

        if (!giftCardRequestId) {
            throw new Error('Invalid gift card request ID');
        }

        try {
            // Get memory image URLs from album if provided
            let memoryImageUrls: string[] | null = [];
            if (albumId) {
                const albums = await AlbumRepository.getAlbums({ id: albumId });
                if (albums.length === 1) {
                    memoryImageUrls = albums[0].images;
                    console.log('[INFO] Found album with', memoryImageUrls?.length || 0, 'images');
                } else {
                    console.warn('[WARN] Album not found:', albumId);
                }
            }

            // Get and update gift card request
            const giftCardRequestResp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
                { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
            ]);

            if (giftCardRequestResp.results.length !== 1) {
                throw new Error('Gift card request not found');
            }

            const giftCardRequest = giftCardRequestResp.results[0];
            (giftCardRequest as any).album_id = albumId || null;
            giftCardRequest.updated_at = new Date();
            
            await GiftCardsRepository.updateGiftCardRequest(giftCardRequest);
            console.log('[INFO] Updated gift card request with album ID');

            // Update memory images for all trees in the request
            const updateMemoryImages = {
                memory_images: memoryImageUrls,
                updated_at: new Date(),
            };

            await this.updateTreesForGiftRequest(giftCardRequest.id, updateMemoryImages);
            console.log('[INFO] Updated memory images for trees in request');

        } catch (error) {
            console.error('[ERROR] Failed to update gift card request album:', error);
            throw error;
        }
    }

    /**
     * Get gift card request details with album information
     */
    async getGiftCardRequestWithAlbum(giftCardRequestId: number): Promise<any> {
        const resp = await GiftCardsRepository.getGiftCardRequests(0, 1, [
            { columnField: 'id', operatorValue: 'equals', value: giftCardRequestId }
        ]);

        if (resp.results.length !== 1) {
            throw new Error('Gift card request not found');
        }

        const giftCardRequest = resp.results[0];

        // Get album details if album_id exists
        if (giftCardRequest.album_id) {
            const albums = await AlbumRepository.getAlbums({ id: giftCardRequest.album_id });
            if (albums.length === 1) {
                (giftCardRequest as any).album = albums[0];
            }
        }

        return giftCardRequest;
    }

    /**
     * Generate comprehensive report for gift card request
     * Includes request details, trees, users, and album information
     */
    async generateGiftCardReport(giftCardRequestId: number): Promise<{
        request: any;
        trees: any[];
        users: any[];
        album?: any;
        statistics: {
            totalTrees: number;
            totalUsers: number;
            totalAmount: number;
            mailsSent: number;
        };
    }> {
        console.log('[INFO] Generating comprehensive report for gift card:', giftCardRequestId);

        try {
            // Get request details with album
            const request = await this.getGiftCardRequestWithAlbum(giftCardRequestId);

            // Get trees and users
            const trees = await GiftCardsRepository.getGiftCardUserAndTreeDetails(giftCardRequestId);
            const users = await GiftCardsRepository.getGiftRequestUsers(giftCardRequestId);

            // Calculate statistics
            const statistics = {
                totalTrees: trees.length,
                totalUsers: users.length,
                totalAmount: request.amount || 0,
                mailsSent: trees.filter((tree: any) => tree.mail_sent).length
            };

            console.log('[INFO] Report generated with statistics:', statistics);

            return {
                request,
                trees,
                users,
                album: request.album,
                statistics
            };
        } catch (error) {
            console.error('[ERROR] Failed to generate gift card report:', error);
            throw error;
        }
    }

    /**
     * Get fund request status and details
     */
    async getFundRequestStatus(giftCardRequestId: number): Promise<{
        hasFundRequest: boolean;
        pdfGenerated: boolean;
        emailSent: boolean;
        lastUpdated?: Date;
    }> {
        try {
            const request = await this.getGiftCardRequestWithAlbum(giftCardRequestId);
            
            // Check if fund request related fields exist (this would depend on your data model)
            const status = {
                hasFundRequest: !!request.fund_request_id,
                pdfGenerated: !!request.fund_request_pdf_url,
                emailSent: !!request.fund_request_email_sent,
                lastUpdated: request.updated_at
            };

            return status;
        } catch (error) {
            console.error('[ERROR] Failed to get fund request status:', error);
            throw error;
        }
    }

    /**
     * Bulk update album for multiple gift card requests
     */
    async bulkUpdateAlbums(updates: Array<{
        giftCardRequestId: number;
        albumId?: number;
    }>): Promise<{
        successful: number;
        failed: number;
        errors: string[];
    }> {
        console.log('[INFO] Bulk updating albums for', updates.length, 'requests');

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const update of updates) {
            try {
                await this.updateGiftCardRequestAlbum(update.giftCardRequestId, update.albumId);
                successful++;
            } catch (error) {
                failed++;
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Request ${update.giftCardRequestId}: ${errorMessage}`);
                console.error('[ERROR] Failed to update album for request:', update.giftCardRequestId, error);
            }
        }

        console.log('[INFO] Bulk update completed:', { successful, failed });

        return {
            successful,
            failed,
            errors
        };
    }

    /**
     * Helper method to update trees for a gift request
     * Updates memory images and other fields for all trees in a gift request
     */
    private async updateTreesForGiftRequest(giftRequestId: number, updateFields: any): Promise<void> {
        try {
            // Update all trees for the gift request at once
            await TreeRepository.updateTrees(updateFields, { gift_request_id: giftRequestId });
            console.log('[INFO] Updated trees for gift request:', giftRequestId);
        } catch (error) {
            console.error('[ERROR] Failed to update trees for gift request:', giftRequestId, error);
            throw error;
        }
    }
}

export default new GiftCardReportingService();