import { Request, Response } from 'express';
import { status } from '../helpers/status';
import * as uploadHelper from './helper/uploadtos3';
import UserTreeModel from '../models/userprofile';

export const addMemories = async (req: Request, res: Response): Promise<void> => {
  if (!req.body.date) {
    res.status(status.bad).send({ error: 'Date required' });
    return;
  }

  // Dates required for inserting memories
  let newdate = new Date(req.body.date);
  const offset = newdate.getTimezoneOffset();
  newdate = new Date(newdate.getTime() - offset * 60 * 1000);
  const newdateString = newdate.toISOString().split('T')[0];
  // newdate = newdate.toISOString().split('T')[0];
  // End date should not be next date
  const enddate = `${newdateString}T23:59:59`;

  // Memory images are required
  const memoryimages = req.body.memoryimages.split(',');
  if (memoryimages.length === 0) {
    res.status(status.bad).send({ error: 'No memory image provided' });
    return;
  }

  // Add memory images to album named by given date
  const memoryImageUrls: string[] = [];
  for (const image of memoryimages) {
    const location = await uploadHelper.UploadFileToS3(image, 'albums', newdateString);
    if (location !== '') {
      memoryImageUrls.push(location);
    }
  }

  try {
    await UserTreeModel.updateMany(
      { date_added: { $gte: newdate, $lte: enddate }, plantation_type: 'onsite' },
      { $set: { memories: memoryImageUrls } }
    );
    res.status(status.created).send();
  } catch (error) {
    res.status(status.error).json({ error });
  }
};
