// const { status } = require("../helpers/status");
// // const { getFirestore } = require('firebase-admin/firestore');

// /** 
//  * Schema for donation
//  type Donation {
//     id: string,
//     email: string,
//     name: string, 
//     phone?: string,
//     amount: number,
//     trees: number,
//     date: Date,
//     assigned: boolean
//  }
// */

// // TODO: Transform donation objects to flat objects: Donation
// // TODO: Extract common code to helpers

// async function getAllDonations(req, res) {
//     // firebase admin sdk
//     try {
//         const donations = getFirestore().collection("donations")
//         const querySnap = await donations.get();
//         if (querySnap.empty) {
//             res.status(status.notfound).send({
//                 status: status.notfound,
//                 donations: []
//             });
//             return
//         }

//         res.status(status.success).send({
//             status: status.success,
//             donations: snapToArray(querySnap)
//         });
//         return
//     }
//     catch (error) {
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
// }

// async function getAllUnassignedDonations(req, res) {
//     try {
//         // console.log("Getting All unassigned donations")
//         const donations = getFirestore().collection("donations")
//         const querySnap = await donations.where('assigned', '==', false).get();
//         if (querySnap.empty) {
//             res.status(status.notfound).send({
//                 status: status.notfound,
//                 donations: []
//             });
//             return
//         }

//         res.status(status.success).send({
//             status: status.success,
//             donations: snapToArray(querySnap)
//         });
//         return
//     }
//     catch (error) {
//         console.log(error)
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
// }

// async function getDonationsForEmail(req, res) {
//     const emailId = req.params?.email
//     if (!emailId) {
//         res.status(status.error).json({
//             status: status.error,
//             message: "Email is required",
//         });
//     }

//     try {
//         // console.log("Getting All donations for email: ", emailId)
//         const donations = getFirestore().collection("donations")
//         const querySnap = await donations.where('donor.email_id', '==', emailId).get();
//         if (querySnap.empty) {
//             res.status(status.notfound).send({
//                 status: status.notfound,
//                 donations: []
//             });
//             return
//         }

//         res.status(status.success).send({
//             status: status.success,
//             donations: snapToArray(querySnap)
//         });
//         return
//     }
//     catch (error) {
//         console.log(error)
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
//     // email, name, phone ? , amount, trees, date, assigned
// }

// async function getDonationsById(req, res) {
//     const id = req.params?.id
//     if (!id) {
//         res.status(status.error).json({
//             status: status.error,
//             message: "Order ID is required",
//         });
//     }

//     try {
//         // console.log("Getting donation with ID: ", id)
//         const donation = await getFirestore().collection("donations").doc(id).get()

//         if (!donation.exists) {
//             res.status(status.notfound).send({
//                 status: status.notfound
//             });
//             return
//         }

//         res.status(status.success).send({
//             status: status.success,
//             donation: donation.data()
//         });
//         return
//     }
//     catch (error) {
//         console.log(error)
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
//     // email, name, phone ? , amount, trees, date, assigned
// }

// async function assignDonation(req, res) {
//     // mark donation as assigned
//     const id = req.params?.id
//     if (!id) {
//         res.status(status.error).json({
//             status: status.error,
//             message: "Order ID is required",
//         });
//     }

//     try {
//         console.log(`Marking donation ${id} as assigned`)
//         await getFirestore()
//             .collection("donations")
//             .doc(id).update({
//                 "assigned": true
//             });

//         res.status(status.success).send({
//             status: status.success,
//         });
//         return

//     }
//     catch (error) {
//         console.log(error)
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
// }

// async function getDonor(req, res) {
//     // get donor info
//     const emailId = req.params?.email
//     if (!emailId) {
//         res.status(status.error).json({
//             status: status.error,
//             message: "Email is required",
//         });
//     }

//     try {
//         const donor = await getFirestore().collection("donors").doc(emailId).get()
//         if (!donor.exists) {
//             res.status(status.notfound).send({
//                 status: status.notfound
//             });
//             return
//         }

//         res.status(status.success).send({
//             status: status.success,
//             donor: donor.data()
//         });
//         return
//     }
//     catch (error) {
//         console.log(error)
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
// }

// module.exports = { 
//     getAllDonations,
//     getAllUnassignedDonations,
//     getDonationsForEmail,
//     getDonationsById,
//     assignDonation,
//     getDonor
// };

// // helper functions: move -> ../helpers ?
// function snapToArray(snap) {
//     const arr = [];
//     snap.forEach(doc => {
//         arr.push(doc.data());
//     });
//     return arr;
// }