import { Op, WhereOptions } from "sequelize";

export const getQueryExpression = (filedName: string, operatorValue: string, value: string | string[] | undefined): WhereOptions => {

    switch(operatorValue) {
        case 'contains':
            return { [filedName]: { [Op.iLike]: `%${value}%` }};
        case 'equals':
            return { [filedName]: value };
        case 'startsWith':
            return { [filedName]: { [Op.iLike]: `${value}%` }};
        case 'endsWith':
            return { [filedName]: { [Op.iLike]: `%${value}` }};
        case 'isEmpty':
            return { [filedName]: { [Op.is]: null } };
        case 'isNotEmpty':
            return { [filedName]: { [Op.not]: null } }
        case 'isAnyOf':
            return { [filedName]: { [Op.in]: value } };

        default:
            return { [filedName]: value }
    }
}