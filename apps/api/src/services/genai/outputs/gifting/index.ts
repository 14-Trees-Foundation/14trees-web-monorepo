import cardDetailsSchema from "./card_details";
import confirmSchema from "./confirm";
import contactDetailsSchema from "./contact_details";
import listPreviousRequestsSchema from "./gift_request_details";
import occasionDetailsSchema from "./occasion_details";
import paymentSchema from "./payment_details";
import recipientDetailsSchema from "./recipient_details";
import sponsorSchema from "./sponsor_details";

function getOutputSchemas() {

    return [
        confirmSchema,
        sponsorSchema,
        recipientDetailsSchema,
        occasionDetailsSchema,
        cardDetailsSchema,
        paymentSchema,
        contactDetailsSchema,
        listPreviousRequestsSchema,
    ]
}

export default getOutputSchemas;
export {
    sponsorSchema,
    recipientDetailsSchema,
}