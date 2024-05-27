import { sequelize } from "../config/postgreDB";

export class DonationRepository {
    public static async getDonations(offset: number = 0, limit: number = 20): Promise<any[]> {
        const query = `select str_to_timestamp("DonationDate")::date as donaion_date, "DonorName" as donor_name, "Donor Type" as donor_type, "Phone" , "Email" , "PAN" ,
        "Pledged" ,
        "Land type", "Zone", "Grove", "PlantationLandType", 
        "DashboardStatus", "Assigned plot",    "Tree planted",    "Assigner's dashboard",    "Remarks for inventory"
        from donations d 
        offset ${offset} limit ${limit}`
        const results = await sequelize.query(query);
        return results;
    }
}
