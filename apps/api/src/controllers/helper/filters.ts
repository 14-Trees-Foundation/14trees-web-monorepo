import { Op, WhereOptions } from "sequelize";

export const getWhereOptions = (fieldName: string, operatorValue: string, value?: any): WhereOptions => {

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
        case 'greaterThan':
            return { [fieldName]: { [Op.gt]: value } };
        case 'lessThan':
            return { [fieldName]: { [Op.lt]: value } };
        case 'between':
            return { [fieldName]: { [Op.between]: value } };

        default:
            return { [fieldName]: value }
    }
}

export const getSqlQueryExpression = (fieldName: string, operatorValue: string, valuePlaceHolder: string, value?: any): { condition: string, replacement: any } => {

    if (operatorValue !== 'isEmpty' && operatorValue !== 'isNotEmpty' && value === undefined) {
        throw new Error("Value is required");
    }

    if (fieldName.endsWith('.tags') && operatorValue === 'isAnyOf') {
        return {
            condition: `exists ( SELECT 1 FROM unnest(${fieldName}) AS txt(tag) WHERE txt.tag = ANY(ARRAY[:${valuePlaceHolder}]))`,
            replacement: { [valuePlaceHolder]: value }
        }
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
                if (Array.isArray(value)) {
                    const hasNull = value.includes(null);
                    const nonNullValues = value.filter(v => v !== null);
                    
                    let conditionParts = [];
                    let replacement: any = {};
            
                    if (hasNull) {
                        conditionParts.push(`${fieldName} IS NULL`);
                    }
            
                    if (nonNullValues.length > 0) {
                        conditionParts.push(`${fieldName} IN (:${valuePlaceHolder})`);
                        replacement[valuePlaceHolder] = nonNullValues;
                    }
            
                    return {
                        condition: '(' + conditionParts.join(' OR ') + ')',
                        replacement: replacement
                    };
                }
                return { condition: `${fieldName} IN (:${valuePlaceHolder})`, replacement: { [valuePlaceHolder]: value } };
        case 'greaterThan':
            return { condition: `${fieldName} > :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };;
        case 'lessThan':
            return { condition: `${fieldName} < :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };;
        case 'between':
            return { condition: `${fieldName} BETWEEN :${valuePlaceHolder}_0 AND :${valuePlaceHolder}_1`, replacement: { [valuePlaceHolder+'_0']: value[0], [valuePlaceHolder+'_1']: value[1] } };;

        default:
            return { condition: `${fieldName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
    }
}