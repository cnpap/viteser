import type { Block, FunctionBody, ParameterDeclaration } from 'typescript'
import ts from 'typescript'
import type { AnalyzedOptions, ImportedObject, UseServerParams } from './type'

export function removeAllImports(node: ts.Node): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  function visit(node: ts.Node, context: ts.TransformationContext): ts.Node | undefined {
    // 如果是 ImportDeclaration，则返回 undefined，相当于删除这个节点
    if (ts.isImportDeclaration(node))
      return undefined

    return ts.visitEachChild(node, child => visit(child, context), context)
  }
  const result = ts.transform(node, [context => root => visit(root, context) as ts.Node])
  const transformedSourceFile = result.transformed[0]
  const resultText = printer.printFile(transformedSourceFile as ts.SourceFile)
  result.dispose()
  return resultText
}

export function compileTypeScript(code: string) {
  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2017,
  }
  const output = ts.transpileModule(code, { compilerOptions })

  return output.outputText
}

export function extractImports(node: ts.Node, importsMap: Record<string, ImportedObject>) {
  if (ts.isImportDeclaration(node)) {
    const moduleName = node.moduleSpecifier.getText(node.getSourceFile()).replace(/['"]/g, '')
    if (node.importClause) {
      if (node.importClause.name) {
        importsMap[node.importClause.name.text] = {
          type: 'default',
          identifier: node.importClause.name.text,
          moduleName,
        }
      }

      if (node.importClause.namedBindings) {
        if (ts.isNamedImports(node.importClause.namedBindings)) {
          node.importClause.namedBindings.elements.forEach((element) => {
            importsMap[element.name.text] = {
              type: 'named',
              identifier: element.name.text,
              moduleName,
            }
          })
        }
        else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          importsMap[node.importClause.namedBindings.name.text] = {
            type: 'namespace',
            identifier: node.importClause.namedBindings.name.text,
            moduleName,
          }
        }
      }
    }
  }
  ts.forEachChild(node, child => extractImports(child, importsMap))
}

function analyzeFunctionUsage(node: ts.Node, options: AnalyzedOptions, usedImports: ImportedObject[]) {
  function visit(node: ts.Node): void {
    if (ts.isIdentifier(node) && options.importsMap[node.text])
      usedImports.push(options.importsMap[node.text])
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(node, visit)
}

function isFun(node: ts.Node) {
  return (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.body && ts.isBlock(node.body)
}

function funStatements(node: ts.Node) {
  return ((node as unknown as ts.FunctionDeclaration).body as FunctionBody).statements
}

/**
 * 获取所有 "use server" 函数
 *
 * 在这里不用为每个函数单独区分 imports
 * 我们以一个文件为最小单位
 *
 * @param node
 * @param options
 */
export function analyzeUseServerNode(node: ts.Node, options: AnalyzedOptions) {
  if (isFun(node)) {
    for (const statement of funStatements(node)) {
      if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
        if (statement.expression.text === 'use server') {
          let functionName = ''
          if (ts.isFunctionDeclaration(node))
            functionName = (node.name as any).text
          else if (ts.isFunctionExpression(node) && node.parent && ts.isVariableDeclaration(node.parent))
            functionName = (node.parent.name as any).text
          else if (ts.isArrowFunction(node) && node.parent && ts.isVariableDeclaration(node.parent))
            functionName = (node.parent.name as any).text
          else
            functionName = 'anonymous'
          const usedImports: ImportedObject[] = []
          analyzeFunctionUsage(node, options, usedImports)
          const params: UseServerParams[] = [] as UseServerParams[]

          ((node as any).parameters as ParameterDeclaration[]).forEach((param) => {
            /**
             * 对于每个参数，获取其类型
             */
            if (param.name) {
              const _param: UseServerParams = {
                name: (param.name as any).text,
                type: 'any',
              }
              if (param.type)
                _param.type = param.type.getText(node.getSourceFile()!)

              params.push(_param)
            }
          })
          const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
          /**
           * 将 usedImports 中 identifier 重复的条数删除
           */
          const uniqueImports: ImportedObject[] = []
          usedImports.forEach((item) => {
            if (!uniqueImports.some(i => i.identifier === item.identifier))
              uniqueImports.push(item)
          })
          options.functions.push({
            fileId: '',
            position: [node.getStart(), node.getEnd()],
            /**
             * function
             *
             * function a() {}
             *
             * arrow
             *
             * const a = () => {}
             *
             * expression
             *
             * const a = function() {}
             */
            type: ts.isFunctionDeclaration(node) ? 'function' : ts.isArrowFunction(node) ? 'arrow' : 'expression',
            name: functionName,
            body: printer.printNode(ts.EmitHint.Unspecified, ((node as any).body as Block), node.getSourceFile()!),
            params,
            usedImports,
          })
          break
        }
      }
    }
  }
  ts.forEachChild(node, child => analyzeUseServerNode(child, options))
}

export function findPipeAssignments(node: ts.Node) {
  const assignments: string[] = []
  function visit(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (declaration.initializer && ts.isCallExpression(declaration.initializer)) {
          const expression = declaration.initializer.expression
          // 检查函数名是否为 "pipe"
          if (expression && ts.isIdentifier(expression) && expression.escapedText === 'pipe') {
            if (declaration.name && ts.isIdentifier(declaration.name))
              assignments.push(declaration.name.escapedText.toString())
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  ts.forEachChild(node, visit)
  return assignments
}
