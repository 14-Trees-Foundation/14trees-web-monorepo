import { Op, WhereOptions } from "sequelize";

export const getWhereOptions = (filedName: string, operatorValue: string, value: string | string[] | undefined): WhereOptions => {

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

export const getSqlQueryExpression = (filedName: string, operatorValue: string, valuePlaceHolder: string, value?: any): { condition: string, replacement: any } => {

    if (operatorValue !== 'isEmpty' && operatorValue !== 'isNotEmpty' && value === undefined) {
        throw new Error("Value is required");
    }

    switch(operatorValue) {
        case 'contains':
            return { condition: `${filedName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `%${value}%` } };
        case 'equals':
            return { condition: `${filedName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
        case 'startsWith':
            return { condition: `${filedName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `${value}%` } };
        case 'endsWith':
            return { condition: `${filedName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `%${value}` } };
        case 'isEmpty':
            return { condition: `${filedName} IS NULL`, replacement: {} };
        case 'isNotEmpty':
            return { condition: `${filedName} IS NOT NULL`, replacement: {} }
        case 'isAnyOf':
            return { condition: `${filedName} IN (:${valuePlaceHolder})`, replacement: { [valuePlaceHolder]: value } };

        default:
            return { condition: `${filedName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
    }
}