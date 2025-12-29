// import { ContributionUser, ContributeRequest, Contribution, Donor, PaymentOrder, RazorpayResponse, VerificationResponse } from "schema";
// import { getPaymentOrder } from "../services/getPaymentOrder";
// import { verifySignature } from "../services/razorpayService";
// import connect from "../services/mongo";
// import mail from "../services/sendgridService";
// import { ObjectId } from "mongodb";

// export async function verifyPayment(req: { body: { donor: Donor, contribution: Contribution, razorpayResponse: RazorpayResponse}}, res: any) {
//     const {donor, contribution, razorpayResponse} = req.body;
//     console.log(req.body)
//     if (!contribution || !donor || !razorpayResponse) {
//         return res.status(400).json({ status: "invalid", message: "Invalid request", emailSent: false });
//     }
//     if (!(contribution.order?.type === "one-time")) {
//         return res.status(400).json({ status: "invalid", message: "Invalid contribution type", emailSent: false });
//     }
//     if (!contribution?.order?.orderId) {
//         return res.status(500).json({ status: "failed", message: "Error updating payment. Please contact support.", emailSent: false });
//     }
//     if (contribution.order.type !== "one-time") {
//         return res.status(400).json({ status: "invalid", message: "Invalid contribution type", emailSent: false });
//     }
//     let response: VerificationResponse = {
//         status: "failed",
//         message: "Error updating payment. Please contact support.",
//         orderId: contribution.order.orderId,
//         paymentId: razorpayResponse.razorpay_payment_id,
//         emailSent: false
//     }
//     try {
//         if (verifySignature(razorpayResponse)) {
//             const updateStatus = await Promise.all([
//                 updatePaid(contribution.order.orderId),
//                 sendEmail(donor, contribution)
//             ])
//             if (updateStatus[0] && updateStatus[1]) {
//                 response.emailSent = true;
//                 response.status = "success";
//                 response.message = "Payment successful";
//                 return res.status(200).json(response);
//             }
//             return res.status(500).json(response);
//         }
//     }
//     catch (error) {
//         console.log(error);
//         return res.status(500).json(response);
//     }
// }

// export async function createContribution(req: { body: ContributeRequest}, res: any) {
//     const { contribution, donor } = req.body;
//     if (!contribution || !donor ) {
//         return res.status(400).json({ status: "invalid", message: "Invalid request", emailSent: false });
//     }
//     if (!(contribution.order?.type === "one-time")) {
//         return res.status(400).json({ status: "invalid", message: "Invalid contribution type", emailSent: false });
//     }
//     if (!contribution?.order?.orderId) {
//         return res.status(500).json({ status: "failed", message: "Error updating payment. Please contact support.", emailSent: false });
//     }
//     if (contribution.order.type !== "one-time") {
//         return res.status(400).json({ status: "invalid", message: "Invalid contribution type", emailSent: false });
//     }
//     try {
//         // generate a payment order if contribution is one-time
//         if (contribution.order.type === "one-time") {
//             const paymentOrder = await getPaymentOrder({ 
//                 trees: contribution.order.trees, 
//                 currency: contribution.order.currency,
//                 orderId: contribution.order.orderId
//             })
//             contribution.order.amount = paymentOrder.amount_due;
//             contribution.order.orderId = paymentOrder.id;
//             await saveContribution(contribution, donor);
//             return res.status(200).json({
//                 order: paymentOrder,
//                 contribution: contribution,
//                 donor: donor
//             });
//         }
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Error creating contribution" });
//     }
// }

// async function saveContribution(contribution: Contribution, donor: Donor) {
//     const db = await connect();

//     // does the donor already exist?
//     async function getOrCreateDonor(): Promise<ObjectId> {
//         const name = donor.first_name + " " + donor.last_name;
//         const userid = donor.first_name + "_" + donor.email_id;
//         const newUser: ContributionUser = {
//             name,
//             userid,
//             pan: donor.pan,
//             phone: donor.phone,
//             email: donor.email_id,
//             comms: donor.comms,
//         }

//         const donorCollection = db.collection<ContributionUser>("users");

//         // user already exists with the same userid ?
//         let existingDonor = await donorCollection.findOne({ userid });
//         if (existingDonor) return existingDonor._id;
        
//         // user already exists with the same email and name ?
//         existingDonor = await donorCollection.findOne({ email: donor.email_id });
//         if (existingDonor && existingDonor.name === name) return existingDonor._id;

//         // id/name is different? -> create a new user, and set parent to existingDonor
//         if (existingDonor && existingDonor.name !== name) {
//             // @ts-ignore
//             const donorResult = await donorCollection.insertOne({ ...newUser, parent: existingDonor._id });
//             return donorResult.insertedId;
//         }

//         // no existing donor matches? -> create a new user
//         const donorResult = await donorCollection.insertOne(newUser);
//         return donorResult.insertedId;
//     }

//     // @ts-ignore
//     contribution.donor = await getOrCreateDonor();
    
//     // save contribution to DB
//     const contributionCollection = db.collection<Contribution>("contributions");
//     const contributionResult = await contributionCollection.insertOne(contribution);
// }

// export async function getMyContributions(req: any, res: any) {
//     const db = await connect();
//     const collection = db.collection<Contribution>("contributions");
//     const contributions = await collection.find({ donor: req.user._id }).toArray();
//     return res.status(200).json(contributions);
// }

// async function updatePaid(contribution_order_Id: string): Promise<boolean> {
//     const db = await connect();
//     const collection = db.collection<Contribution>("contributions");
//     try {
//         await collection.updateOne({ "order.orderId": contribution_order_Id }, 
//             { $set: { "order.status": "captured" } });
//         return true;
//     } catch(error) {
//         console.log(error);
//         return false;
//     }
// }

// async function sendEmail(donor: Donor, contribution: Contribution): Promise<boolean> {
//     if (!contribution || !donor ) {
//         throw new Error("Invalid request");
//     }
//     if (!contribution?.order) {
//         throw new Error("Invalid contribution");
//     }
//     try {
//         // send email to donor
//         // wait 200ms, and log email sent to console, and return true
//         // await new Promise(resolve => setTimeout(resolve, 200));
//         // console.log("Email sent to donor");
//         // return Promise.resolve(true);
//         let sendgridTemplateId;
//         if (contribution.order.type === "one-time") {
//             // from: 'contact@14trees.org',
//             // to: donor.email_id,
//             // templateId: sendgridTemplateId,
//             // text: "Thank you for your contribution!",
//             sendgridTemplateId = "d-2d49001eb114492d96d18903319a1009"
//             const emailResponse = await mail.send({
//                 from: { email: 'contact@14trees.org', name: '14Trees Foundation' },
//                 personalizations: [{
//                     to: [{ email: donor.email_id, name: donor.first_name }],
//                     dynamicTemplateData: {
//                         first_name: donor.first_name,
//                         name: `${donor.first_name} ${donor.last_name}`,
//                         campaign: contribution.campaign,
//                         amount:  `${contribution.order.currency} ${contribution.order.amount/100}`,
//                         details: donor.pan ? `PAN ${donor.pan}` : "-",
//                     }
//                 }],
//                 templateId: sendgridTemplateId
//             })
//         }
//         return Promise.resolve(true);
//     } catch(error) {
//         console.log(error);
//         return Promise.resolve(false);
//     }
// }

// // example email
// // to: [{ email: donor.email_id, name: donor.first_name }],
// // dynamicTemplateData: {
// //     first_name: donor.first_name,
// //     name: `${donor.first_name} ${donor.last_name}`,
// //     campaign: contribution.campaign,
// //     amount:  `${contribution.order.currency} ${contribution.order.amount/100}`,
// //     details: donor.pan ? `PAN ${donor.pan}` : "-",
// // }
// // {
// //    "from":{
// //       "email":"example@.sendgrid.net"
// //    },
// //    "personalizations":[
// //       {
// //          "to":[
// //             {
// //                "email":"example@sendgrid.net"
// //             }
// //          ],
// //          "dynamic_template_data":{
// //             "total":"$ 239.85",
// //             "items":[
// //                {
// //                   "text":"New Line Sneakers",
// //                   "image":"https://marketing-image-production.s3.amazonaws.com/uploads/8dda1131320a6d978b515cc04ed479df259a458d5d45d58b6b381cae0bf9588113e80ef912f69e8c4cc1ef1a0297e8eefdb7b270064cc046b79a44e21b811802.png",
// //                   "price":"$ 79.95"
// //                },
// //                {
// //                   "text":"Old Line Sneakers",
// //                   "image":"https://marketing-image-production.s3.amazonaws.com/uploads/3629f54390ead663d4eb7c53702e492de63299d7c5f7239efdc693b09b9b28c82c924225dcd8dcb65732d5ca7b7b753c5f17e056405bbd4596e4e63a96ae5018.png",
// //                   "price":"$ 79.95"
// //                },
// //                {
// //                   "text":"Blue Line Sneakers",
// //                   "image":"https://marketing-image-production.s3.amazonaws.com/uploads/00731ed18eff0ad5da890d876c456c3124a4e44cb48196533e9b95fb2b959b7194c2dc7637b788341d1ff4f88d1dc88e23f7e3704726d313c57f350911dd2bd0.png",
// //                   "price":"$ 79.95"
// //                }
// //             ],
// //             "receipt":true,
// //             "name":"Sample Name",
// //             "address01":"1234 Fake St.",
// //             "address02":"Apt. 123",
// //             "city":"Place",
// //             "state":"CO",
// //             "zip":"80202"
// //           }
// //       }
// //    ],
// //    "template_id":"[template_id]"
// // }