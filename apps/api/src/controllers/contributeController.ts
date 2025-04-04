import { Request, Response } from "express";
import { status } from "../helpers/status";
import { ContributionRepository } from "../repo/contributionRepo";

const contributionRepo = new ContributionRepository();

export const getContributions = async (req: Request, res: Response) => {
  try {
    const contributions = await contributionRepo.findAll();
    res.status(status.success).send(contributions);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const createContribution = async (req: Request, res: Response) => {
  try {
    const contribution = await contributionRepo.create(req.body);
    res.status(status.success).send(contribution);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const updateContribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contribution = await contributionRepo.update(Number(id), req.body);
    res.status(status.success).send(contribution);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const deleteContribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await contributionRepo.delete(Number(id));
    res.status(status.success).send({ message: "Contribution deleted successfully" });
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};