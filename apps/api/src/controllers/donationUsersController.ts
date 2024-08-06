import { status } from "../helpers/status";
import { Request, Response } from "express";
import { UserRepository } from "../repo/userRepo";
import { User, UserCreationAttributes } from "../models/user";
import { validateCSV } from "./helper/parsecsv";
import { DonationRepository} from "../repo/donationsRepo"
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { FilterItem } from "../models/pagination";
import { DonationUserRepository } from "../repo/donationUsersRepo";

/*
    Model - Donation Users
    CRUD Operations for donation_users table
*/

export const addDonationUsersBulk = async (req: Request, res: Response) => {

  try {
    if (!req.file) {
        res.status(404).json({ message: 'No file uploaded. Bulk operation requires data as csv file.' });
        return;
    }
    if (!req.body.donation_id || isNaN(parseInt(req.body.donation_id))) {
        res.status(404).json({ message: 'Donation id is required' });
        return;
    }

    const donationId = parseInt(req.body.donation_id);
    const { path } = req.file
    const data = await validateCSV<UserCreationAttributes>(path);

    const donationResp = await DonationRepository.getDonations(0, 1, { id: donationId });
    if (donationResp.results.length === 0) {
      res.status(404).json({ error: 'Donation not found' });
      return;
    }
    const donation = donationResp.results[0];

    let users: User[] = [];
    for (const row of data.valid_records) {
      try {
          const resp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: row.email, operatorValue: 'equals' }]);
          if (resp.results.length > 0) {
              users.push(resp.results[0]);
          } else {
              const user = await UserRepository.addUser(row);
              users.push(user);
          }
      } catch (error: any) {
        console.error('Error creating user for donation-user group', error);
        let error_record = { ...row, error: "Failed to create user", status: "error" };
        data.invalid_records.push(error_record);
      }
    }
    const userIds = users.map(user => user.id);

    // const donationUserGroups = await DonationUserRepository.createDonationUsers(userIds, donation.id);
    // res.status(201).json({ success: donationUserGroups.length, failed: data.invalid_records.length, failed_records: data.invalid_records });

  } catch (error:any) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ error: error.message });
  }
};