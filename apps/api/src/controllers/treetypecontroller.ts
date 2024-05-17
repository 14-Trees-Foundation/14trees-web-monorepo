import { Request, Response } from 'express';
import TreeTypeRepository from '../repo/treetypeRepo';

import status from '../helpers/status';

const treeTypeRepository = new TreeTypeRepository();

export const createTreeType = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.body.name) {
      throw new Error("Tree name is required");
    }
    if (!req.body.tree_id) {
      throw new Error("Tree ID required");
    }

    // let imageUrl = "";
    // if (req.files && req.files[0]) {
    //   imageUrl = await uploadHelper.UploadFileToS3(req.files[0].filename, "treetype");
    // }

    const treeTypeData = {
      // name: req.body.name,
      // tree_id: req.body.tree_id,
      // desc: req.body.desc,
      // scientific_name: req.body.scientific_name,
      // // image: imageUrl,
      // family: req.body.family,
      // habit: req.body.habit,
      // remarkable_char: req.body.remarkable_char,
      // med_use: req.body.med_use,
      // other_use: req.body.other_use,
      // food: req.body.food,
      // eco_value: req.body.eco_value,
      // parts_used: req.body.parts_used,
      
    };

    await treeTypeRepository.create(treeTypeData);

    res.status(201).json({
      status: "Created!",
      message: "Successfully created treetype!",
    });

    
  } catch (error) {
    res.status(501).json(error);
  }
};
