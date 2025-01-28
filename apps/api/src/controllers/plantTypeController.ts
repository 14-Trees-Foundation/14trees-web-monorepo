/*
  Model - PlantType
  CRUD Operations for plant_types table
*/

import { Request, Response } from "express";
import PlantTypeRepository from "../repo/plantTypeRepo";
import { getOffsetAndLimitFromRequest } from "./helper/request";
import { status } from "../helpers/status";
import { isArray } from "lodash";
import { FilterItem } from "../models/pagination";
import { getWhereOptions } from "./helper/filters";
import { syncNotionPlantTypeIllustrations } from "../services/notion/plant_type_illustrations";
import PlantTypeTemplateRepository from "../repo/plantTypeTemplateRepo";
import { Op } from "sequelize";
import { streamIllustrationToS3 } from "./helper/plant_types";
import { getSlideThumbnail } from "./helper/slides";
import { uploadImageUrlToS3 } from "./helper/uploadtos3";

export const getPlantTypes = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  let whereClause = {};
  if (filters && filters.length > 0) {
    filters.forEach(filter => {
      whereClause = { ...whereClause, ...getWhereOptions(filter.columnField, filter.operatorValue, filter.value) }
    })
  }

  try {
    let result = await PlantTypeRepository.getPlantTypes(offset, limit, whereClause);
    res.status(status.success).send(result);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const addPlantType = async (req: Request, res: Response) => {
  try {
    if (!req.body.name) {
      throw new Error("PlantName (name) is required");
    }
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }

  // Save the info into the sheet
  try {
    const plantType = await PlantTypeRepository.addPlantType(req.body, isArray(req.files) ? req.files : [])
    res.status(status.created).json(plantType);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};


export const updatePlantType = async (req: Request, res: Response) => {
  try {
    const plantType = await PlantTypeRepository.updatePlantType(req.body, isArray(req.files) ? req.files : [])
    res.status(status.success).json(plantType);
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
  }
};

export const deletePlantType = async (req: Request, res: Response) => {
  try {
    const resp = await PlantTypeRepository.deletePlantType(req.params.id)
    console.log("Delete PlantTypes Response for id: %s", req.params.id, resp);

    res.status(status.success).json({
      message: `Plant Type with id '${req.params.id}' deleted successfully`,
    });
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const searchPlantTypes = async (req: Request, res: Response) => {
  try {
    if (!req.params.search || req.params.search.length < 3) {
      res.status(status.bad).send({ error: "Please provide at least 3 char to search" });
      return;
    }

    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    let whereClause = getWhereOptions("name", "contains", req.params.search);
    const plantTypes = await PlantTypeRepository.getPlantTypes(offset, limit, whereClause);
    res.status(status.success).send(plantTypes);
    return;
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getPlantTypesForPlot = async (req: Request, res: Response) => {
  try {
    const plotId = parseInt(req.params.plot_id)
    if (isNaN(plotId)) {
      res.status(status.bad).send({ error: "Please provide valid plot id!" });
      return;
    }

    const plantTypes = await PlantTypeRepository.plantTypesPresentInPlot(plotId);
    res.status(status.success).send(plantTypes);
    return;
  } catch (error: any) {
    res.status(status.bad).send({ error: error.message });
    return;
  }
};

export const getPlantTypeTags = async (req: Request, res: Response) => {
  try {
    const plantTypeTags = await PlantTypeRepository.getPlantTypeTags(0, 100);
    res.status(status.success).send(plantTypeTags);
  } catch (error: any) {
    console.log("[ERROR]", "PlantTypeController::getPlantTypeTags", error);
    res.status(status.error).send({ message: "Something went wrong. Please try again after some time" });
  }
}

const parseCountToInt = (data: any[]) => {
  return data.map(item => {
    return {
      ...item,
      total: parseInt(item.total),
      booked: parseInt(item.booked),
      assigned: parseInt(item.assigned),
      available: parseInt(item.available),
      card_available: parseInt(item.card_available),
      unbooked_assigned: parseInt(item.unbooked_assigned),
      void_available: parseInt(item.void_available),
      void_assigned: parseInt(item.void_assigned),
      void_booked: parseInt(item.void_booked),
      void_total: parseInt(item.void_total),
    }
  })
}

export const getTreeCountsForPlantTypes = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  const order_by: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

  try {
    let result = await PlantTypeRepository.getPlantTypeStates(offset, limit, filters, order_by);
    result.results = parseCountToInt(result.results);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "PlantTypeController::getTreeCountsForPlantTypes", error);
    res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again after some time",
    });
  }
}

export const getPlantTypeStateForPlots = async (req: Request, res: Response) => {
  const { offset, limit } = getOffsetAndLimitFromRequest(req);
  const filters: FilterItem[] = req.body?.filters;
  const order_by: { column: string, order: "ASC" | "DESC" }[] = req.body?.order_by;

  try {
    let result = await PlantTypeRepository.getPlantTypeStateForPlots(offset, limit, filters, order_by);
    result.results = parseCountToInt(result.results);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log("[ERROR]", "PlantTypeController::getPlantTypeStateForPlots", error);
    res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again after some time",
    });
  }
}

export const syncPlantTypeIllustrationsDataFromNotion = async (req: Request, res: Response) => {
  try {
    await syncNotionPlantTypeIllustrations();
    await PlantTypeRepository.syncPlantTypeIllustrations()

    res.status(status.success).json();
  } catch (error: any) {
    console.log('[ERROR]', 'PlantTypesController::syncPlantTypeIllustrationsDataFromNotion', error);
    res.status(status.bad).send({ message: 'Something went wrong!' });
  }
}

export const addPlantTypeTemplate = async (req: Request, res: Response) => {
  const { plant_type, template_id } = req.body;
  if (!plant_type || !template_id) {
    res.status(status.bad).send({ message: "Please provide valid plantType and templateId!" });
    return;
  }

  const presentationId = process.env.GIFT_CARD_PRESENTATION_ID;
  if (!presentationId) {
    res.status(status.error).send({ message: "Can't add new plant type templates at the moment!" });
    return;
  }


  try {
    const plantType = plant_type.trim();
    const templateId = template_id.trim();

    const ptt = await PlantTypeTemplateRepository.getPlantTypeTemplate(plantType, templateId);
    if (ptt) {
      if (plantType === ptt.plant_type && templateId === ptt.template_id) {
        res.status(status.success).send(ptt);
      } else if (plantType === ptt.plant_type) {
        res.status(status.bad).send({
          message: "Plant type template already exists!"
        });
      } else if (templateId === ptt.template_id) {
        res.status(status.bad).send({
          message: "Plant type template id you provided is already associated with another plant type!"
        });
      }

      return;
    }

    const templateImageUrl = await getSlideThumbnail(presentationId, templateId);
    const s3Path = await uploadImageUrlToS3(templateImageUrl, `plant-types/${templateId}_${plantType}.jpg`)

    const result = await PlantTypeTemplateRepository.addPlantTypeTemplate(plantType, templateId, s3Path);
    res.status(status.success).send(result);
  } catch (error: any) {
    console.log('[ERROR]', 'PlantTypesController::addPlantTypeTemplate', error);
    res.status(status.bad).send({ message: 'Something went wrong. Please try again after some time!' });
  }
}

export const uploadIllustrationsToS3 = async (req: Request, res: Response) => {

  try {

    let total = 200;
    const limit = 200;
    let offset = 0;

    while (offset < total) {
      const response = await PlantTypeRepository.getPlantTypes(offset, limit, { illustration_link: { [Op.ne]: null }, illustration_s3_path: { [Op.is]: null } });
      total = response.total;
      offset += limit;

      for (const plantType of response.results) {
        if (!plantType.illustration_link) continue;

        try {
          const location = await streamIllustrationToS3(plantType.illustration_link, `${plantType.name}.jpg`);
          if (location) await plantType.update({ illustration_s3_path: location, updated_at: new Date() });
        } catch (error: any) {
          console.log('[ERROR]', 'PlantTypesController::uploadIllustrationsToS3', error);
        }
      }
    }

  } catch (error: any) {
    console.log('[ERROR]', 'PlantTypesController::uploadIllustrationsToS3', error);
    res.status(status.bad).send({ message: 'Something went wrong. Please try again after some time!' });
  }
}

export const getPlantTypeStatsForCorporate = async (req: Request, res: Response) => {
    const { offset, limit } = getOffsetAndLimitFromRequest(req);
    const filters: FilterItem[] = req.body?.filters;
    const groupId: number = req.body?.group_id;

    try {
        let result = await PlantTypeRepository.getPlantTypeStatsForCorporate(offset, limit, groupId, filters);
        result.results = result.results.map((item: any) => {
            return {
                ...item,
                booked: parseInt(item.booked),
            }
        })

        res.status(status.success).send(result);
    } catch (error: any) {
        console.log("[ERROR]", "PlantTypesController::getPlantTypeStatesForCorporate", error);
        res.status(status.error).json({
            status: status.error,
            message: "Something went wrong. Please try again after some time.",
        });
    }
}