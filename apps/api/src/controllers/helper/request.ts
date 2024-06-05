import { constants } from "../../constants";

export const getOffsetAndLimitFromRequest = (req: any) => {
    const offset = isNaN(parseInt(req.query?.offset)) ? constants.DEFAULT_PAGINATION_OFFSET : parseInt(req.query?.offset);
    const limit = isNaN(parseInt(req.query?.limit)) ? constants.DEFAULT_PAGINATION_LIMIT : parseInt(req.query?.limit);

    return {
        offset: offset,
        limit: limit
    }
}