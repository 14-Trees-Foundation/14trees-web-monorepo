import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { GiftCardTemplatesService } from "../../facade/giftCard/giftCardTemplatesService";
import archiver from 'archiver';
import axios from 'axios';

export class GiftCardTemplatesController {
    /**
     * Create gift cards for users
     */
    static async createGiftCards(req: Request, res: Response) {
        const { users, gift_card_request_id: giftCardRequestId } = req.body;

        if (!giftCardRequestId || !users || users.length === 0) {
            return res.status(status.bad).json({
                message: 'Please provide valid input details!'
            });
        }

        try {
            const updated = await GiftCardTemplatesService.createGiftCards(giftCardRequestId, users);
            res.status(status.success).send(updated);
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::createGiftCards", error);
            res.status(status.error).json({
                message: error.message || 'Something went wrong. Please try again later.'
            });
        }
    }

    /**
     * Generate gift card templates for a gift card request
     */
    static async generateGiftCardTemplatesForGiftCardRequest(req: Request, res: Response) {
        const { gift_card_request_id: giftCardRequestId } = req.params;

        try {
            // Send the response early - because generating cards may take a while. Users can download card later
            res.status(status.success).send();

            await GiftCardTemplatesService.generateGiftCardTemplatesForRequest(parseInt(giftCardRequestId));
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::generateGiftCardTemplatesForGiftCardRequest", error);
        }
    }

    /**
     * Update gift card images for a gift request
     */
    static async updateGiftCardImagesForGiftRequest(req: Request, res: Response) {
        const { gift_card_request_id: giftCardRequestId } = req.params;

        try {
            // Send the response early - because generating cards may take a while. Users can download card later
            res.status(status.success).send();

            await GiftCardTemplatesService.updateGiftCardImagesForRequest(parseInt(giftCardRequestId));
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::updateGiftCardImagesForGiftRequest", error);
        }
    }

    /**
     * Download gift card templates for a gift card request
     */
    static async downloadGiftCardTemplatesForGiftCardRequest(req: Request, res: Response) {
        const { gift_card_request_id: giftCardRequestId } = req.params;
        const { downloadType } = req.query;

        try {
            const result = await GiftCardTemplatesService.downloadGiftCardTemplatesForRequest(
                parseInt(giftCardRequestId), 
                downloadType as string
            );

            if (result.type === 'file') {
                res.setHeader('Content-Type', result.mimeType);
                res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
                
                if (result.fileData) {
                    result.fileData.pipe(res);

                    // Handle errors during streaming
                    result.fileData.on('error', (error) => {
                        console.error('Error streaming the file:', error);
                        res.status(500).send('Error streaming the file');
                    });
                } else {
                    res.status(500).send('File data not available');
                }
            } else if (result.type === 'zip') {
                res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
                res.setHeader('Content-Type', 'application/zip');
                
                const archive = archiver('zip', {
                    zlib: { level: 9 },
                });

                archive.pipe(res);

                if (result.giftCards) {
                    for (const giftCard of result.giftCards) {
                        if (!giftCard.card_image_url) continue;

                        try {
                            const response = await axios({
                                url: giftCard.card_image_url,
                                method: 'GET',
                                responseType: 'stream',
                            });

                            archive.append(response.data, { 
                                name: `${(giftCard as any).user_name}_${(giftCard as any).sapling_id}.jpg` 
                            });
                        } catch (error: any) {
                            console.error(`Failed to download image from templateImage:`, error.message);
                        }
                    }
                }
                
                await archive.finalize();
                res.status(status.success).send();
            }
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::downloadGiftCardTemplatesForGiftCardRequest", error);
            res.status(status.error).json({
                message: error.message || 'Something went wrong. Please try again later.'
            });
        }
    }

    /**
     * Generate a gift card slide
     */
    static async generateGiftCardSlide(req: Request, res: Response) {
        const {
            sapling_id: saplingId,
            plant_type: plantType,
            user_name: userName,
            gifted_by: giftedBy,
            primary_message: primaryMessage,
            logo,
            logo_message: logoMessage,
            is_personal: isPersonal
        } = req.body;

        try {
            const result = await GiftCardTemplatesService.generateGiftCardSlide({
                saplingId,
                plantType,
                userName,
                giftedBy,
                primaryMessage,
                logo,
                logoMessage,
                isPersonal
            });

            res.status(status.success).send(result);
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::generateGiftCardSlide", error);
            res.status(status.error).json({
                message: error.message || 'Something went wrong. Please try again later.'
            });
        }
    }

    /**
     * Update a gift card template
     */
    static async updateGiftCardTemplate(req: Request, res: Response) {
        const {
            user_name: userName,
            gifted_by: giftedBy,
            sapling_id: saplingId,
            slide_id: slideId,
            primary_message: primaryMessage,
            logo,
            logo_message: logoMessage,
            trees_count: treeCount,
            assignee_name: assigneeName,
            event_type: eventType,
        } = req.body;

        if (!slideId) {
            return res.status(status.bad).json({
                status: status.bad,
                message: 'Please provide valid input details!'
            });
        }

        try {
            await GiftCardTemplatesService.updateGiftCardTemplate({
                userName,
                giftedBy,
                saplingId,
                slideId,
                primaryMessage,
                logo,
                logoMessage,
                treeCount,
                assigneeName,
                eventType
            });

            res.status(status.success).send();
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::updateGiftCardTemplate", error);
            res.status(status.error).json({
                message: error.message || 'Something went wrong. Please try again later.'
            });
        }
    }

    /**
     * Generate adhoc tree cards
     */
    static async generateAdhocTreeCards(req: Request, res: Response) {
        const { sapling_ids } = req.body;
        
        if (!sapling_ids || !Array.isArray(sapling_ids)) {
            return res.status(status.bad).json({
                message: 'Array of sapling ids required!'
            });
        }

        try {
            const presentationId = await GiftCardTemplatesService.generateAdhocTreeCards(sapling_ids);

            return res.status(status.created).send({
                url: `https://docs.google.com/presentation/d/${presentationId}/view`
            });
        } catch (error: any) {
            console.log("[ERROR]", "GiftCardTemplatesController::generateAdhocTreeCards", error);
            res.status(status.bad).send({ 
                message: error.message || 'Something went wrong. Please try again later.' 
            });
        }
    }
}