import { Request, Response } from "express";
import { status } from "../helpers/status";
import { ContributionRepository } from "../repo/contributionRepo";

export const getContributions = async (req: Request, res: Response) => {
  try {
    const contributions = await ContributionRepository.findAll();
    res.status(status.success).send(contributions);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const createContribution = async (req: Request, res: Response) => {
  try {
    const contribution = await ContributionRepository.create(req.body);
    res.status(status.success).send(contribution);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const updateContribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contribution = await ContributionRepository.update(id, req.body);
    res.status(status.success).send(contribution);
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};

export const deleteContribution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await ContributionRepository.delete(id);
    res.status(status.success).send({ message: "Contribution deleted successfully" });
  } catch (error: any) {
    res.status(status.error).send({ error: error.message });
  }
};