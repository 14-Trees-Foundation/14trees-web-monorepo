import { Donations , DonationAttributes, DonationCreationAttributes} from '../models/donation'
import { PaginatedResponse } from "../models/pagination";
import { WhereOptions } from 'sequelize';

export class DonationRepository {
 
    public static async getDonations(offset: number = 0, limit: number = 20 , whereClause: WhereOptions): Promise<PaginatedResponse<Donations>> {
        // Fetching data using Sequelize's findAll method with pagination
        const response = await Donations.findAll({
            where: whereClause,
            offset: Number(offset),
            limit: Number(limit),
        });

        return {
            results : response,
            total: await Donations.count({ where : whereClause}),
            offset: offset
        }
       
    }

    public static async addDonation(donationData: DonationCreationAttributes ): Promise<Donations> {
        const new_donation = Donations.create(donationData);
        return new_donation;
    }

    public static async deleteDonation(donationId: string): Promise<number>{
           const result = await Donations.destroy({ where : {id : donationId} });
           return result;
    }

    public static async updateDonation(DonationData: DonationAttributes): Promise<Donations>{
       
        try {
            // Find the donation by its primary key (id)
            const donation = await Donations.findByPk(DonationData.id);
    
            if (!donation) {
                throw new Error('Donation not found for given id');
            }
    
            // Update the donation with provided data
            const [numRowsUpdated, updatedDonations] = await Donations.update(DonationData, {
                where: { id: DonationData.id }, // Specify the condition for which record(s) to update
                returning: true, // Ensure Sequelize returns the updated record(s)
            });
    
            if (numRowsUpdated === 0) {
                throw new Error('Failed to update donation');
            }
    
            // Sequelize returns an array when using returning: true, so we take the first element
            return updatedDonations[0];
        } catch (error: any) {
            throw new Error(`Error updating donation: ${error.message}`);
        }
    }
}
