import { Contribution } from "../models/contribution";
import { Repository } from "./base/repository";

export class ContributionRepository extends Repository<Contribution> {
  constructor() {
    super(Contribution);
  }
} 