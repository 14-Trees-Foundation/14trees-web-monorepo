import { Activity } from '../models/activity';


export class ActivityRepository {

  public async getActivities(): Promise<Activity[]> {
    try {
      return await Activity.findAll();
    } catch (error) {
      throw error;
    }
  }

  public async addActivity(activityData: Activity): Promise<Activity> {
    try {

      if (!activityData.title) {
        throw new Error('Title required');
      }
      if (!activityData.type) {
        throw new Error('Activity Type required');
      }
      if (!activityData.date) {
        throw new Error('Date required');
      }
      if (!activityData.desc) {
        throw new Error('Activity Description required');
      }

      // Upload images to S3
      // const imageurls: string[] = [];
      // if (activityData.images.length > 0) {
      //   const images = activityData.images.split(',');
      //   for (const image of images) {
      //     const location = await this.uploadHelper.UploadFileToS3(image, 'activities');
      //     if (location !== '') {
      //       imageurls.push(location);
      //     }
      //   }
      // }

      // Activity object to be saved in database
      const actObj = {
        title: activityData.title,
        type: activityData.type,
        date:  new Date(activityData.date),
        desc: activityData.desc,
        author: activityData.author,
        video: activityData.video ? activityData.video : null,   //this is the link for the video
        // images: imageurls,
      };
      const activity = await Activity.create(actObj);

      return activity   //if it is added successfully then it returns activity variable
 

    } catch (error) {
      throw error;
    }
  }
}
