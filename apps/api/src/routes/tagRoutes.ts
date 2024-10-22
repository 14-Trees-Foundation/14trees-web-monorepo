import { Router } from 'express';
import * as tag from '../controllers/tagsController';

const routes = Router();

routes.get('/', tag.getTags);
routes.post('/', tag.createTags);

export default routes;
