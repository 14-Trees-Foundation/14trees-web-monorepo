import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Organization as OrgModel } from '../models/org'; // Import your Sequelize model for Org

export class OrgRepository {
    static async getOrgs(req: Request, res: Response): Promise<void> {
        const { offset = 0, limit = 10 } = req.query;
        const filters: any = {};
        if (req.query?.name) {
            filters.name = { [Op.iLike]: `%${req.query.name}%` };
        }
        if (req.query?.type) {
            filters.type = { [Op.iLike]: `%${req.query.type}%` };
        }
        try {
            const result = await OrgModel.findAll({
                where: filters,
                offset: Number(offset),
                limit: Number(limit),
            });
            res.status(200).send(result);
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error,
            });
        }
    }

    static async addOrg(req: Request, res: Response): Promise<void> {
        if (!req.body.name) {
            res.status(400).send({ error: 'Organization name is required' });
            return;
        }

        const orgData = {
            name: req.body.name,
            date_added: new Date().toISOString(),
            desc: req.body.desc || '',
            type: req.body.type || '',
        };

        // try {
        //     const org = await OrgModel.create(orgData);
        //     // Save the info into the sheet
        //     csvhelper.UpdateOrg(orgData);
        //     res.status(201).json({
        //         org,
        //         csvupload: 'Success',
        //     });
        // } catch (error) {
        //     res.status(400).json({
        //         error: error,
        //     });
        // }
    }

    static async updateOrg(req: Request, res: Response): Promise<void> {
        try {
            const org = await OrgModel.findByPk(req.params.id);
            if (!org) {
                throw new Error('Organization not found for given id');
            }

            if (req.body.name) {
                org.name = req.body.name;
            }
            if (req.body.desc) {
                org.desc = req.body.desc;
            }
            if (req.body.type) {
                org.type = req.body.type;
            }

            const updatedOrg = await org.save();
            res.status(200).send(updatedOrg);
        } catch (error) {
            res.status(400).send({ error: error });
        }
    }

    static async deleteOrg(req: Request, res: Response): Promise<void> {
        try {
            const response = await OrgModel.destroy({
                where: { id: req.params.id },
            });
            console.log('Delete Org Response for orgId:', req.params.id, response);
            res.status(200).send({
                message: 'Organization deleted successfully',
            });
        } catch (error) {
            res.status(400).send({ error: error });
        }
    }
}
