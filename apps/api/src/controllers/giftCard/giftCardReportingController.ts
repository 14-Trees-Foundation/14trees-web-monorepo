import { Request, Response } from "express";
import { status } from "../../helpers/status";
import { Logger } from "../../helpers/logger";
import GiftCardReportingService from "../../facade/giftCard/giftCardReportingService";

/**
 * Gift Card Reporting Controller
 * Handles HTTP requests for gift card reporting and administrative operations
 */

/**
 * Generate fund request PDF
 * GET /gift-card-requests/:gift_card_request_id/fund-request/generate
 */
export const generateFundRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        return res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
    }

    try {
        console.log('[INFO] Generating fund request PDF for:', giftCardRequestId);

        const result = await GiftCardReportingService.generateFundRequestPdf(parseInt(giftCardRequestId));
        
        return res.status(status.success).send({ url: result.pdfUrl.location });

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::generateFundRequest", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftCardRequestId
        });

        await Logger.logError('giftCardReportingController', 'generateFundRequest', error, req);

        return res.status(status.bad).send({ 
            message: error.message || 'Something went wrong. Please try again later.' 
        });
    }
};

/**
 * Send fund request email
 * POST /gift-card-requests/:gift_card_request_id/fund-request/send
 */
export const sendFundRequest = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        return res.status(status.bad).json({
            message: 'Please provide valid input details!'
        });
    }

    try {
        console.log('[INFO] Sending fund request email for:', giftCardRequestId);

        const result = await GiftCardReportingService.sendFundRequestEmail(parseInt(giftCardRequestId));
        
        return res.status(status.success).json({
            message: result.message,
            pdf_url: result.pdfUrl
        });

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::sendFundRequest", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftCardRequestId
        });

        await Logger.logError('giftCardReportingController', 'sendFundRequest', error, req);

        return res.status(status.error).send({ 
            message: error.message || 'Something went wrong. Please try again later.' 
        });
    }
};

/**
 * Update gift card request album
 * PUT /gift-card-requests/:gift_card_request_id/album
 */
export const updateGiftCardRequestAlbum = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId, album_id: albumId } = req.body;
    
    if (!giftCardRequestId) {
        return res.status(status.bad).send({ message: "Invalid input!" });
    }

    try {
        console.log('[INFO] Updating album for gift card request:', giftCardRequestId, 'Album ID:', albumId);

        await GiftCardReportingService.updateGiftCardRequestAlbum(giftCardRequestId, albumId);
        
        res.status(status.success).send();

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::updateGiftCardRequestAlbum", {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            giftCardRequestId,
            albumId
        });

        await Logger.logError('giftCardReportingController', 'updateGiftCardRequestAlbum', error, req);

        res.status(status.error).json({
            status: status.error,
            message: error.message,
        });
    }
};

/**
 * Get comprehensive gift card report
 * GET /gift-card-requests/:gift_card_request_id/report
 */
export const getGiftCardReport = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        const report = await GiftCardReportingService.generateGiftCardReport(parseInt(giftCardRequestId));
        
        res.status(status.success).json(report);

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::getGiftCardReport", error);
        await Logger.logError('giftCardReportingController', 'getGiftCardReport', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Get fund request status
 * GET /gift-card-requests/:gift_card_request_id/fund-request/status
 */
export const getFundRequestStatus = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        const fundRequestStatus = await GiftCardReportingService.getFundRequestStatus(parseInt(giftCardRequestId));
        
        res.status(status.success).json(fundRequestStatus);

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::getFundRequestStatus", error);
        await Logger.logError('giftCardReportingController', 'getFundRequestStatus', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Bulk update albums for multiple gift card requests
 * PUT /gift-card-requests/bulk-update-albums
 */
export const bulkUpdateAlbums = async (req: Request, res: Response) => {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return res.status(status.bad).json({
            message: 'Please provide valid updates array!'
        });
    }

    try {
        console.log('[INFO] Bulk updating albums for', updates.length, 'requests');

        const result = await GiftCardReportingService.bulkUpdateAlbums(updates);
        
        res.status(status.success).json(result);

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::bulkUpdateAlbums", error);
        await Logger.logError('giftCardReportingController', 'bulkUpdateAlbums', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};

/**
 * Get gift card request with album details
 * GET /gift-card-requests/:gift_card_request_id/with-album
 */
export const getGiftCardRequestWithAlbum = async (req: Request, res: Response) => {
    const { gift_card_request_id: giftCardRequestId } = req.params;
    
    if (!giftCardRequestId || isNaN(parseInt(giftCardRequestId))) {
        return res.status(status.bad).json({
            message: 'Please provide valid gift card request ID!'
        });
    }

    try {
        const requestWithAlbum = await GiftCardReportingService.getGiftCardRequestWithAlbum(parseInt(giftCardRequestId));
        
        res.status(status.success).json(requestWithAlbum);

    } catch (error: any) {
        console.error("[ERROR] GiftCardReportingController::getGiftCardRequestWithAlbum", error);
        await Logger.logError('giftCardReportingController', 'getGiftCardRequestWithAlbum', error, req);

        res.status(status.error).send({
            message: 'Something went wrong. Please try again later.'
        });
    }
};