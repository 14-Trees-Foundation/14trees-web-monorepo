import { Op, WhereOptions } from "sequelize";

// Whitelist of allowed operators
const ALLOWED_OPERATORS = new Set([
  'contains',
  'equals',
  'startsWith',
  'endsWith',
  'isEmpty',
  'isNotEmpty',
  'isAnyOf',
  'greaterThan',
  'lessThan',
  'between'
]);

// Validation function for field names
function validateFieldName(fieldName: string): boolean {
  // Only allow alphanumeric characters, underscores, dots, and quotes
  return /^[a-zA-Z0-9_."]+$/.test(fieldName);
}

export const getWhereOptions = (fieldName: string, operatorValue: string, value?: any): WhereOptions => {
    // Validate operator
    if (!ALLOWED_OPERATORS.has(operatorValue)) {
        throw new Error(`Invalid operator: ${operatorValue}`);
    }

    switch (operatorValue) {
        case 'contains':
            return { [fieldName]: { [Op.iLike]: `%${value}%` } };
        case 'equals':
            return { [fieldName]: value };
        case 'startsWith':
            return { [fieldName]: { [Op.iLike]: `${value}%` } };
        case 'endsWith':
            return { [fieldName]: { [Op.iLike]: `%${value}` } };
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
    // Validate field name
    if (!validateFieldName(fieldName)) {
        throw new Error(`Invalid field name: ${fieldName}`);
    }

    // Validate operator
    if (!ALLOWED_OPERATORS.has(operatorValue)) {
        throw new Error(`Invalid operator: ${operatorValue}`);
    }

    if (operatorValue !== 'isEmpty' && operatorValue !== 'isNotEmpty' && value === undefined) {
        throw new Error("Value is required");
    }

    // Validate value based on operator
    if (operatorValue === 'between' && (!Array.isArray(value) || value.length !== 2)) {
        throw new Error("Between operator requires an array of two values");
    }

    if (operatorValue === 'isAnyOf' && !Array.isArray(value)) {
        throw new Error("isAnyOf operator requires an array value");
    }

    if (fieldName.endsWith('.tags')) {
        let condition = "";
        if (operatorValue === 'isAnyOf') {
            if (!Array.isArray(value)) {
                throw new Error("Tags filter requires an array value");
            }
            condition = `${fieldName} && ARRAY[:${valuePlaceHolder}]::varchar[]`;
        } else if (operatorValue === 'contains') {
            if (!Array.isArray(value)) {
                throw new Error("Tags filter requires an array value");
            }
            condition = `${fieldName} @> ARRAY[:${valuePlaceHolder}]::varchar[]`;
        }

        return {
            condition: condition,
            replacement: { [valuePlaceHolder]: value }
        }
    }

    switch (operatorValue) {
        case 'contains':
            if (typeof value !== 'string') {
                throw new Error("Contains operator requires a string value");
            }
            return { condition: `${fieldName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `%${value}%` } };
        case 'equals':
            return { condition: `${fieldName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
        case 'startsWith':
            if (typeof value !== 'string') {
                throw new Error("StartsWith operator requires a string value");
            }
            return { condition: `${fieldName} ILIKE :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: `${value}%` } };
        case 'endsWith':
            if (typeof value !== 'string') {
                throw new Error("EndsWith operator requires a string value");
            }
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
            if (typeof value !== 'number' && typeof value !== 'string') {
                throw new Error("GreaterThan operator requires a number or string value");
            }
            return { condition: `${fieldName} > :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
        case 'lessThan':
            if (typeof value !== 'number' && typeof value !== 'string') {
                throw new Error("LessThan operator requires a number or string value");
            }
            return { condition: `${fieldName} < :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
        case 'between':
            if (!Array.isArray(value) || value.length !== 2) {
                throw new Error("Between operator requires an array of two values");
            }
            if (typeof value[0] !== 'number' && typeof value[0] !== 'string' || 
                typeof value[1] !== 'number' && typeof value[1] !== 'string') {
                throw new Error("Between operator requires number or string values");
            }
            return { 
                condition: `${fieldName} BETWEEN :${valuePlaceHolder}_0 AND :${valuePlaceHolder}_1`, 
                replacement: { 
                    [valuePlaceHolder + '_0']: value[0], 
                    [valuePlaceHolder + '_1']: value[1] 
                } 
            };

        default:
            return { condition: `${fieldName} = :${valuePlaceHolder}`, replacement: { [valuePlaceHolder]: value } };
    }
}