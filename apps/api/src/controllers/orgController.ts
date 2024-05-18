import { Request, Response } from 'express';
import { errorMessage, successMessage, status } from "../helpers/status";
import OrgModel from "../models/org";
import csvhelper from "./helper/uploadtocsv";

export const addOrg = async (req: Request, res: Response): Promise<void> => {
  if (!req.body.name) {
    res.status(status.bad).send({ error: "Organization name is required" });
    return;
  }

  const obj = {
    name: req.body.name,
    date_added: new Date().toISOString(),
    desc: req.body.desc ? req.body.desc : "",
    type: req.body.type ? req.body.type : "",
  };

  const org = new OrgModel(obj);

  let orgRes;
  try {
    orgRes = await org.save();
  } catch (error) {
    res.status(status.bad).json({ error });
    return;
  }

  // Save the info into the sheet
  try {
    csvhelper.UpdateOrg(obj);
    res.status(status.created).json({
      org: orgRes,
      csvupload: "Success",
    });
  } catch (error) {
    res.status(status.error).json({
      org: orgRes,
      csvupload: "Failure",
    });
  }
};

export const getOrg = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await OrgModel.find();
    res.status(status.success).send(result);
  } catch (error) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};
