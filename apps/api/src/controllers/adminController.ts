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

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id);
        const { roles } = req.body;

        // Validation
        if (!userId || isNaN(userId)) {
            res.status(status.bad).json({ error: 'Valid user ID is required' });
            return;
        }

        if (!roles || !Array.isArray(roles)) {
            res.status(status.bad).json({ error: 'Roles must be provided as an array' });
            return;
        }

        // Validate role values
        const validRoles = ['admin', 'user', 'treelogging'];
        const invalidRoles = roles.filter(role => !validRoles.includes(role));
        if (invalidRoles.length > 0) {
            res.status(status.bad).json({ 
                error: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}` 
            });
            return;
        }

        // Check if user exists
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            res.status(status.notfound).json({ error: 'User not found' });
            return;
        }

        // Update user roles
        const updatedUser = await UserRepository.updateUser({
            id: userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            user_id: user.user_id,
            communication_email: user.communication_email,
            birth_date: user.birth_date,
            pin: user.pin,
            roles: roles,
            rfr: user.rfr
        });

        res.status(status.success).json({ 
            message: 'User roles updated successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roles: updatedUser.roles
            }
        });
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
};

export const grantAdminRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id);

        // Validation
        if (!userId || isNaN(userId)) {
            res.status(status.bad).json({ error: 'Valid user ID is required' });
            return;
        }

        // Check if user exists
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            res.status(status.notfound).json({ error: 'User not found' });
            return;
        }

        // Check if user already has admin role
        const currentRoles = user.roles || [];
        if (currentRoles.includes('admin')) {
            res.status(status.bad).json({ error: 'User already has admin role' });
            return;
        }

        // Add admin role to existing roles
        const newRoles = [...currentRoles, 'admin'];

        // Update user with admin role
        const updatedUser = await UserRepository.updateUser({
            id: userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            user_id: user.user_id,
            communication_email: user.communication_email,
            birth_date: user.birth_date,
            pin: user.pin,
            roles: newRoles,
            rfr: user.rfr
        });

        res.status(status.success).json({ 
            message: 'Admin role granted successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roles: updatedUser.roles
            }
        });
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
};

export const revokeAdminRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id);

        // Validation
        if (!userId || isNaN(userId)) {
            res.status(status.bad).json({ error: 'Valid user ID is required' });
            return;
        }

        // Check if user exists
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            res.status(status.notfound).json({ error: 'User not found' });
            return;
        }

        // Check if user has admin role
        const currentRoles = user.roles || [];
        if (!currentRoles.includes('admin')) {
            res.status(status.bad).json({ error: 'User does not have admin role' });
            return;
        }

        // Remove admin role from existing roles
        const newRoles = currentRoles.filter(role => role !== 'admin');

        // Update user without admin role
        const updatedUser = await UserRepository.updateUser({
            id: userId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            user_id: user.user_id,
            communication_email: user.communication_email,
            birth_date: user.birth_date,
            pin: user.pin,
            roles: newRoles,
            rfr: user.rfr
        });

        res.status(status.success).json({ 
            message: 'Admin role revoked successfully',
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roles: updatedUser.roles
            }
        });
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
};

export const getUserRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.id);

        // Validation
        if (!userId || isNaN(userId)) {
            res.status(status.bad).json({ error: 'Valid user ID is required' });
            return;
        }

        // Check if user exists
        const user = await UserRepository.getUserById(userId);
        if (!user) {
            res.status(status.notfound).json({ error: 'User not found' });
            return;
        }

        res.status(status.success).json({ 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: user.roles || []
            }
        });
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
};

export const getAllUsersWithRoles = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Get users with pagination
        const result = await UserRepository.getUsers(offset, limit, []);

        // Format response to include only relevant user info
        const users = result.results.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            roles: user.roles || [],
            created_at: user.created_at,
            updated_at: user.updated_at
        }));

        res.status(status.success).json({
            users: users,
            pagination: {
                page: page,
                limit: limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (error: any) {
        res.status(status.error).json({ error: error.message });
    }
};
