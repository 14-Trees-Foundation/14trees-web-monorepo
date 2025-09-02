import { EventImage, EventImageAttributes, EventImageCreationAttributes } from "../models/event_image";
import { Op } from "sequelize";

class EventImageRepository {
    
    async getEventImages(eventId: number): Promise<EventImage[]> {
        try {
            const images = await EventImage.findAll({
                where: { event_id: eventId },
                order: [['sequence', 'ASC'], ['created_at', 'ASC']]
            });
            return images;
        } catch (error) {
            console.error('[ERROR] EventImageRepository::getEventImages', error);
            throw error;
        }
    }

    async addEventImages(eventId: number, imageUrls: string[]): Promise<EventImage[]> {
        try {
            // Get the current max sequence for this event
            const maxSequenceResult = await EventImage.findOne({
                where: { event_id: eventId },
                order: [['sequence', 'DESC']],
                attributes: ['sequence']
            });

            let nextSequence = maxSequenceResult ? maxSequenceResult.sequence + 1 : 0;
            
            // Create image records with sequential sequence numbers
            const imageData: EventImageCreationAttributes[] = imageUrls.map(url => ({
                event_id: eventId,
                image_url: url,
                sequence: nextSequence++
            }));

            const createdImages = await EventImage.bulkCreate(imageData, {
                returning: true
            });

            return createdImages;
        } catch (error) {
            console.error('[ERROR] EventImageRepository::addEventImages', error);
            throw error;
        }
    }

    async removeEventImages(eventId: number, imageIds: number[]): Promise<void> {
        try {
            await EventImage.destroy({
                where: {
                    event_id: eventId,
                    id: {
                        [Op.in]: imageIds
                    }
                }
            });
        } catch (error) {
            console.error('[ERROR] EventImageRepository::removeEventImages', error);
            throw error;
        }
    }

    async reorderEventImages(eventId: number, imageSequences: {id: number, sequence: number}[]): Promise<void> {
        try {
            // Update each image's sequence
            for (const item of imageSequences) {
                await EventImage.update(
                    { sequence: item.sequence },
                    { 
                        where: { 
                            id: item.id,
                            event_id: eventId // Ensure we only update images for this event
                        }
                    }
                );
            }
        } catch (error) {
            console.error('[ERROR] EventImageRepository::reorderEventImages', error);
            throw error;
        }
    }

    async getEventImageById(imageId: number): Promise<EventImage | null> {
        try {
            return await EventImage.findByPk(imageId);
        } catch (error) {
            console.error('[ERROR] EventImageRepository::getEventImageById', error);
            throw error;
        }
    }
}

export default new EventImageRepository();