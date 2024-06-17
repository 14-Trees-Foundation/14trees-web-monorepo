import { Op, WhereOptions } from "sequelize";

export const getWhereOptions = (fieldName: string, operatorValue: string, value: string | string[] | undefined): WhereOptions => {

    switch(operatorValue) {
        case 'contains':
            return { [fieldName]: { [Op.iLike]: `%${value}%` }};
        case 'equals':
            return { [fieldName]: value };
        case 'startsWith':
            return { [fieldName]: { [Op.iLike]: `${value}%` }};
        case 'endsWith':
            return { [fieldName]: { [Op.iLike]: `%${value}` }};
        case 'isEmpty':
            return { [fieldName]: { [Op.is]: null } };
        case 'isNotEmpty':
            return { [fieldName]: { [Op.not]: null } }
        case 'isAnyOf':
            return { [fieldName]: { [Op.in]: value } };

        default:
            return { [fieldName]: value }
    }
}

export const getSqlQueryExpression = (fieldName: string, operatorValue: string, valuePlaceHolder: string, value?: any): { condition: string, replacement: any } => {

    if (operatorValue !== 'isEmpty' && operatorValue !== 'isNotEmpty' && value === undefined) {
        throw new Error("Value is required");
    }

    switch(operatorValue) {
        case 'contains':
            return { condition: `${fieldName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `%${value}%` } };
        case 'equals':
            return { condition: `${fieldName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
        case 'startsWith':
            return { condition: `${fieldName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `${value}%` } };
        case 'endsWith':
            return { condition: `${fieldName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `%${value}` } };
        case 'isEmpty':
            return { condition: `${fieldName} IS NULL`, replacement: {} };
        case 'isNotEmpty':
            return { condition: `${fieldName} IS NOT NULL`, replacement: {} }
        case 'isAnyOf':
            return { condition: `${fieldName} IN (:${valuePlaceHolder})`, replacement: { [valuePlaceHolder]: value } };

        default:
            return { condition: `${fieldName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
    }
}