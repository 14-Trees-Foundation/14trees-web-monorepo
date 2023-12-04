import * as ts from 'typescript';
import { changeCase } from './helpers';

export default function jsonSchemaToTSInterfaces(schema: any, rootName: string = 'Root'): string {
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