import mongoose from "mongoose";

export const getQueryExpression = (filedName: string, operatorValue: string, value: string | string[] | undefined, isObjectId: boolean = false) => {

    switch(operatorValue) {
        case 'contains':
            return { [filedName]: { $regex: new RegExp((value as string), 'i') } };
        case 'equals':
            if (isObjectId) {
                return { [filedName]: new mongoose.Types.ObjectId(value as string)}
            }
            return { [filedName]: value };
        case 'startsWith':
            return { [filedName]: { $regex: new RegExp( '^' + value, 'i') } };
        case 'endsWith':
            return { [filedName]: { $regex: new RegExp( value + '$', 'i') } };
        case 'isEmpty':
            return { $or: [{ [filedName]: { $exists: false } },{ [filedName]: { $exists: true, $eq: null }}] }
        case 'isNotEmpty':
            return { [filedName]: { $exists: true, $ne: null } }
        case 'isAnyOf':
            return { [filedName]: { $in: value } };

        default:
            return {}
    }
}