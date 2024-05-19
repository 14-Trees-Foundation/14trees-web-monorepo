import { Request, Response } from 'express';
import ActivityModel from '../models/activity';
import * as uploadHelper from './helper/uploadtos3';
import * as csvhelper from './helper/uploadtocsv';
import { errorMessage, successMessage, status } from '../helpers/status';

export const getActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await ActivityModel.find();
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const addActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body.title) {
      throw new Error('Title required');
    }
    if (!req.body.type) {
      throw new Error('Activity Type required');
    }
    if (!req.body.date) {
      throw new Error('Date required');
    }
    if (!req.body.desc) {
      throw new Error('Activity Description required');
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Upload images to S3
  const imageurls: string[] = [];
  if (req.body.images && req.body.images.length > 0) {
    const images = req.body.images.split(',');
    for (const image of images) {
      const location = await uploadHelper.UploadFileToS3(image, 'activities');
      if (location !== '') {
        imageurls.push(location);
      }
    }
  }

  // Activity object to be saved in database
  const actObj = {
    title: req.body.title,
    type: req.body.type,
    date: req.body.date === '' ? new Date().toISOString() : new Date(req.body.date).toISOString(),
    desc: req.body.desc,
    author: req.body.author,
    video: req.body.videolink || null,
    images: imageurls,
  };
  const activity = new ActivityModel(actObj);

  let actRes;
  try {
    actRes = await activity.save();
  } catch (error: any) {
    res.status(status.error).send({
      error: error.message,
    });
    return;
  }

  // Save the info into the sheet
  try {
    csvhelper.UpdateActivityCsv(actObj);
    res.status(status.created).send({
      activity: actRes,
      csvupload: 'Success',
    });
  } catch (error: any) {
    res.status(status.error).send({
      activity: actRes,
      csvupload: 'Failure',
    });
  }
};
