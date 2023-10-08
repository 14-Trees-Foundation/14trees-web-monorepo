import * as ts from 'typescript';

export default function getJsonSchemaFromNotionDB(notionDescribe: any) {
  const schema: any = {
	"$schema": "https://json-schema.org/draft/2019-09/schema",
    "type": "object",
    "properties": {},
    "required": []
  };

  for (const key in notionDescribe) {
    const field = notionDescribe[key];
    switch (field.type) {
      case 'rich_text':
      case 'phone_number':
      case 'email':
      case 'title':
        schema.properties[key] = { "type": "string" };
        break;
      case 'url':
        schema.properties[key] = { "type": "string", "format": "uri" };
        break;
      case 'multi_select':
        schema.properties[key] = {
          "type": "array",
          "items": {
            "type": "string",
            "enum": field.multi_select.options.map((option: { name: any; }) => option.name)
          }
        };
        break;
      case 'select':
        schema.properties[key] = {
          "type": "string",
          "enum": field.select.options.map((option: { name: any; }) => option.name)
        };
        break;
      case 'checkbox':
        schema.properties[key] = { "type": "boolean" };
        break;
      case 'number':
        schema.properties[key] = { "type": "number" };
        break;
      case 'date':
        schema.properties[key] = { "type": "string", "format": "date-time" };
        break;
      default:
        console.warn(`Unsupported type ${field.type} for column ${key}`);
    }
    // schema.required.push(key);
  }

  return schema;
}

export function changeCase(str: string, format: "camel" | "pascal" = "camel"): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, '') // Remove special characters
    .split(' ')
    .map((word, index) => {
      if (index === 0 && format === 'camel') {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

export function jsonSchemaToTSInterfaces(schema: any, rootName: string = 'Root'): string {
   const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile('temp.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const typeAliases: ts.TypeAliasDeclaration[] = [];

  function parseProperty(key: string, property: any): ts.PropertySignature {
    let typeNode: ts.TypeNode;

    switch (property.type) {
      case 'string':
        typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
        break;
      case 'number':
        typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        break;
      case 'boolean':
        typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
        break;
      case 'array':
        if (property.items && property.items.enum) {
          const typeName = changeCase(key, "pascal") + 'Type';
          const unionType = ts.factory.createUnionTypeNode(property.items.enum.map((e: string) => ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(e))));
          typeAliases.push(ts.factory.createTypeAliasDeclaration([ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)], typeName, undefined, unionType));
          typeNode = ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(typeName, undefined));
        } else if (property.items && property.items.type) {
          typeNode = ts.factory.createArrayTypeNode(parseProperty('', property.items).type!);
        } else {
          typeNode = ts.factory.createArrayTypeNode(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
        }
        break;
      case 'object':
        const typeElements: ts.TypeElement[] = [];
        for (const subKey in property.properties) {
          typeElements.push(parseProperty(subKey, property.properties[subKey]));
        }
        typeNode = ts.factory.createTypeLiteralNode(typeElements);
        break;
      default:
        typeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    }

    return ts.factory.createPropertySignature(undefined, changeCase(key), undefined, typeNode);
  }

  const typeElements: ts.TypeElement[] = [];
  for (const key in schema.properties) {
    typeElements.push(parseProperty(key, schema.properties[key]));
  }

  const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    rootName,
    undefined,
    undefined,
    typeElements
  );

  const result = [
    ...typeAliases.map(alias => printer.printNode(ts.EmitHint.Unspecified, alias, sourceFile)),
    printer.printNode(ts.EmitHint.Unspecified, interfaceDeclaration, sourceFile)
  ].join('\n\n');

  return result;
}
