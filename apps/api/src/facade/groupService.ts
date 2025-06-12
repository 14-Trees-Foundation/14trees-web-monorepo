import { GroupRepository } from "../repo/groupRepo";
import { UserGroupRepository } from "../repo/userGroupRepo";
import { UserRepository } from "../repo/userRepo";
import { ViewPermissionRepository } from "../repo/viewPermissionsRepo";
import { v7 as uuidv7 } from 'uuid'

class GroupService {

    public static async registerGroup(corporateData: any, userData: any): Promise<{ path: string, viewId: string, groupId: number }> {
        const group = await GroupRepository.addGroup({
            name: corporateData.name,
            type: "corporate",
            logo_url: corporateData.logo_url,
            address: corporateData.address,
            billing_email: corporateData.billing_email,
            description: corporateData.description || "",
        })

        const user = await UserRepository.upsertUser({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
        })

        await UserGroupRepository.addUserGroup(user.id, group.id);

        // create corporate view for the group
        const viewId = uuidv7().toString();
        const view = await ViewPermissionRepository.createView(
            viewId,
            group.name + "'s Dashboard",
            `/csr/dashboard/${group.id}`,
            null
        )

        await ViewPermissionRepository.addViewUsers(view.id, [user.id]);
        return { path: view.path, viewId: view.view_id, groupId: group.id };
    }
}

export default GroupService;