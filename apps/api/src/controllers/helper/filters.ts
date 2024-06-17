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

export const getSqlQueryExpressionString = (filedName: string, operatorValue: string, valuePlaceHolder: string): string => {

    switch(operatorValue) {
        case 'contains':
            return `${filedName} ILIKE '%:${valuePlaceHolder}%'`
        case 'equals':
            return `${filedName} = :${valuePlaceHolder}`
        case 'startsWith':
            return `${filedName} ILIKE '%:${valuePlaceHolder}'`
        case 'endsWith':
            return `${filedName} ILIKE ':${valuePlaceHolder}%'`
        case 'isEmpty':
            return `${filedName} IS NULL`
        case 'isNotEmpty':
            return `${filedName} IS NOT NULL`
        case 'isAnyOf':
            return `${filedName} IN (:${valuePlaceHolder})`

        default:
            return `${filedName} = :${valuePlaceHolder}`
    }
}