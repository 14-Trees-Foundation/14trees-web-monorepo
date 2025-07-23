import { Request, Response } from 'express';
import { status } from '../helpers/status';
import { UserRepository } from '../repo/userRepo';
import { GroupRepository } from '../repo/groupRepo';
import { UserGroupRepository } from '../repo/userGroupRepo';

export const addStaff = async (req: Request, res: Response): Promise<void> => {
    // Validation
    const { name, phone, email } = req.body;
    try {
        if (!name) throw new Error('Name is required');
        if (!phone) throw new Error('Phone is required');
        if (!email) throw new Error('Email is required');
    } catch (error: any) {
        res.status(status.bad).send({ error: error.message });
        return;
    }

    // Check if user type exists
    const userExists = await UserRepository.getUsers(0, 1, [{ columnField: 'email', operatorValue: 'equals', value: email }]);

    // If plot exists, return error
    if (userExists.results.length > 0) {
        res.status(status.bad).send({ error: 'User ID already exists' });
        return;
    }

    try {
        const user = await UserRepository.addUser(req.body);
        const userRes = await user.update({ roles: ['user'] });
        // const staffGroup = await GroupRepository.getGroups(0, 1, {'type': 'onsite_staff'});
        // if (staffGroup.results.length === 1) {
        //     const userRes = await UserGroupRepository.addUserGroup(user.id, staffGroup.results[0].id);
        //     console.log(user.name, 'added to onsite staff group. User Id:', userRes.user_id)
        // }
        res.status(status.created).json({ user: userRes })
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
        return;
    }
};

// export const getTreeLoggingUsers = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const result = await OnSiteStaffModel.find({ role: { $eq: 'treelogging' } });
//     res.status(status.success).send(result);
//   } catch (error: any) {
//     res.status(status.error).json({
//       status: status.error,
//       message: error.message,
//     });
//   }
// };
