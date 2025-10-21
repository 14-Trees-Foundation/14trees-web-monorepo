import { logResponseError } from "../../../services/whatsapp/logResponseError";
import { sendWhatsAppMessage } from "../../../services/whatsapp/messageHelper";
import { WHATSAPP_SCREENS } from "../whatsAppConstants";
import { WhatsAppDecryptedBody, WhatsAppFlowPayload } from "../whatsAppFlowTypes";
import { VisitUsersRepository } from "../../../../src/repo/visitUsersRepo";
import { UserRepository } from "../../../../src/repo/userRepo";
import { User } from "../../../../src/models/user";
import { VisitRepository } from "../../../../src/repo/visitsRepo";
import { SiteRepository } from "../../../../src/repo/sitesRepo";
import { Op, WhereOptions } from "sequelize";

const visitScreens = Object.values(WHATSAPP_SCREENS.VISIT_FLOW);

function isVisitScreen(screen?: string): screen is typeof visitScreens[number] {
    return !!screen && visitScreens.includes(screen as typeof visitScreens[number]);
}

export async function handleVisitFlowExchange(payload: WhatsAppFlowPayload, decryptedBody: WhatsAppDecryptedBody): Promise<boolean> {
    const screen = decryptedBody.screen;
    if (!isVisitScreen(screen)) {
        return false;
    }

    switch (screen) {
        case WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_WELCOME: {
            payload.screen = WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_SELECT;

            let now = new Date();
            const filters = [
                { columnField: "visit_date", operatorValue: "greaterThan", value: now.toISOString() },
            ]
            const visits = await VisitRepository.getVisits(0, 10, filters)

            const upcoming_visits = visits.results.map(v => ({
                id: String(v.id),         // ensure it's string
                title: v.visit_name,
                description: `On ${v.visit_date} at site: ${v.site_name}`
            }));

            payload.data.upcoming_visits = upcoming_visits;
            return true;
        }

        case WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_SELECT: {
            payload.screen = WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_REGISTRANT_DETAILS;
            const selected_visit_id = decryptedBody.data.selected_visit_id;
            const visit_response = await VisitRepository.getVisit(parseInt(selected_visit_id));
            const site_response = await SiteRepository.getSites(0, 10, [
                        { "id": { [Op.eq]: visit_response.site_id }},
                    ])

            const selected_visit = {
                id: visit_response?.id.toString(),
                title: visit_response?.visit_name,
                description: `${site_response?.results[0].name_english}, On ${visit_response?.visit_date}`,
                visit_date: visit_response?.visit_date,
                site_name: site_response?.results[0].name_english,
                type: visit_response?.visit_type
            
            }

            payload.data.selected_visit = selected_visit;
            return true;
        }

        case WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_REGISTRANT_DETAILS: {
            payload.screen = WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_CONFIRM;
            payload.data = decryptedBody.data ?? {};
            return true;
        }
        case WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_CONFIRM: {
            const visitRegistrationData = decryptedBody.data;
            console.log("Visit Registration to be added in the system: ", visitRegistrationData);
            let visitor:User = await UserRepository.addUser({ name: visitRegistrationData?.visitor_name, email: visitRegistrationData?.visitor_email});
            await VisitUsersRepository.addUser(visitor.id, parseInt(visitRegistrationData?.visit_id));

            payload.screen = WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_SUBMITTED;
            payload.data = { response: "Thank you for the site visit registration.!" };
            return true;
        }
        case WHATSAPP_SCREENS.VISIT_FLOW.SITE_VISIT_SUBMITTED: {
            return true;
        }
        default:
            return false;
    }
}