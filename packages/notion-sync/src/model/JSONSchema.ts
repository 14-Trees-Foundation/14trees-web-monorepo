export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export type JSONSchemaBase = {
    title?: string;
    description?: string;
    default?: any;
    examples?: any[];
    format?: string;
    enum?: any[];
    const?: any;
};

export type JSONSchemaString = JSONSchemaBase & {
    type: 'string';
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: string; // e.g., "date-time", "email", etc.
};

export type JSONSchemaNumber = JSONSchemaBase & {
    type: 'number' | 'integer';
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    multipleOf?: number;
};

export type JSONSchemaArray = JSONSchemaBase & {
    type: 'array';
    items?: JSONSchema | JSONSchema[];
    minItems?: number;
    maxItems?: number;
    uniqueItems?: boolean;
    contains?: JSONSchema;
};

export type JSONSchemaObject = JSONSchemaBase & {
    type: 'object';
    properties?: { [key: string]: JSONSchema };
    required?: string[];
    additionalProperties?: boolean | JSONSchema;
    minProperties?: number;
    maxProperties?: number;
    dependencies?: { [key: string]: JSONSchema | string[] };
    propertyNames?: JSONSchema;
};

export type JSONSchemaBoolean = JSONSchemaBase & {
    type: 'boolean';
};

export type JSONSchemaNull = JSONSchemaBase & {
    type: 'null';
};

export type JSONSchemaRoot = {
    $schema?: string;
    $id?: string;
    $ref?: string;
    definitions?: { [key: string]: JSONSchema };
    type?: JSONSchemaType | JSONSchemaType[];
    allOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    oneOf?: JSONSchema[];
    not?: JSONSchema;
}

export type JSONSchema = JSONSchemaBase & JSONSchemaRoot & (
    | JSONSchemaString
    | JSONSchemaNumber
    | JSONSchemaArray
    | JSONSchemaObject
    | JSONSchemaBoolean
    | JSONSchemaNull
);

