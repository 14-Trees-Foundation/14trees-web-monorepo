// import {
//     errorMessage,
//     successMessage,
//     status,
//   } from "../helpers/status";
//   import OrgModel  from "../models/org";
//   import { UpdateOrg } from "./helper/uploadtocsv"; // Assuming UpdateOrg function exists
//   import { getOffsetAndLimitFromRequest } from "./helper/request";
//   import { Request, Response } from "express";
  

// /*
//     Model - Org
//     CRUD Operations for organizations collection
// */

// module.exports.getOrgs = async (req: Request, res: Response) => {
//     const {offset, limit } = getOffsetAndLimitFromRequest(req);
//     let filters: Record<string,any> = {}
//     if (req.query?.name) {
//         filters["name"] = new RegExp(req.query?.name as string, "i")
//     }
//     if (req.query?.type) {
//         filters["type"] = new RegExp(req.query?.type as string, "i")
//     }
//     try {
//         let result = await OrgModel.find(filters).skip(offset).limit(limit);
//         res.status(status.success).send(result);
//     } catch (error: any) {
//         res.status(status.error).json({
//             status: status.error,
//             message: error.message,
//         });
//     }
// }

// module.exports.addOrg = async (req: Request, res: Response) => {

//     if (!req.body.name) {
//         res.status(status.bad).send({ error: "Organization name is required" });
//         return;
//     }

//     let obj = {
//         name: req.body.name,
//         date_added: new Date().toISOString(),
//         desc: req.body.desc ? req.body.desc : "",
//         type: req.body.type ? req.body.type : "",
//     }
//     let org = new OrgModel(obj)

//     let orgRes;
//     try {
//         orgRes = await org.save();
//     } catch (error) {
//         res.status(status.bad).json({
//             error: error,
//         });
//     }

//     // Save the info into the sheet
//     try {
//         csvhelper.UpdateOrg(obj);
//         res.status(status.created).json({
//             org: orgRes,
//             csvupload: "Success"
//         });
//     } catch (error) {
//         res.status(status.error).json({
//             org: orgRes,
//             csvupload: "Failure"
//         });
//     }
// }


// module.exports.updateOrg = async (req: Request, res: Response) => {

//     try {
//         let org = await OrgModel.findById(req.params.id);
//         if (!org) {
//             throw new Error("Organization not found for given id");
//         }

//         if (req.body.name) {
//             org.name = req.body.name;
//         }
//         if (req.body.desc) {
//             org.name = req.body.desc;
//         }
//         if (req.body.type) {
//             org.name = req.body.type;
//         }

//         const updatedOrg = await org.save();
//         res.status(status.success).send(updatedOrg);

//     } catch (error: any) {
//         res.status(status.bad).send({ error: error.message });
//     }
// }


// module.exports.deleteOrg = async (req: Request, res: Response) => {

//     try {
//         let response = await OrgModel.findByIdAndDelete(req.params.id).exec();
//         console.log("Delete Org Response for orgId: %s", req.params.id, response)

//         res.status(status.success).send({
//             message: "Organization deleted successfully",
//           })
//     } catch (error: any) {
//         res.status(status.bad).send({ error: error.message });
//     }
// }