import express from 'express';
import * as treeSnapshots from '../controllers/treeSnapshotsController';

const routes = express.Router();

routes.get('/:sapling_id', treeSnapshots.getTreeSnapshots);
routes.post('/', treeSnapshots.addTreeSnapshots);

export default routes;
