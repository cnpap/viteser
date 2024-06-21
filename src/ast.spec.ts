import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ts from 'typescript'
import type { AnalyzedOptions, ImportedObject, UseServerFunction } from './type'
import { analyzeUseServerNode, extractImports, findPipeAssignments } from './ast'
import { pluginPack } from './plugin'

describe('should', () => {
  it(
    'extract imports from source code',
    () => {
      const sourceCode = `
import * as demo03 from '@/demo03'
import demo04 from '@/demo04'
import { demo052 } from '@/demo05'
import * as demo05 from '../demo05'
import notImport from './notImport'

const handle = async (a: number) => {
  "use server";
  console.log(demo03.name);
  console.log(demo05);
  console.log(demo052.cc);
}

const noServerComponent = async () => {
  console.log(demo03.name);
}

function ReactComponent() {
  const innserHandle = async () => {
    "use server";
    console.log(demo04.name);
  }
}
`
      const sourceFile = ts.createSourceFile(
        'example.ts',
        sourceCode,
        ts.ScriptTarget.ESNext,
        true,
      )
      const importsMap: Record<string, ImportedObject> = {}
      const functions: UseServerFunction[] = []
      const options: AnalyzedOptions = {
        importsMap,
        functions,
      }
      extractImports(sourceFile, importsMap)
      analyzeUseServerNode(sourceFile, options)
      expect(Object.keys(importsMap).length).toEqual(5)
      expect(options.functions.length).toEqual(2)
      expect(options.functions[0].params.length).toEqual(1)
      expect(options.functions[0].params[0].name).toEqual('a')
      expect(options.functions[0].params[0].type).toEqual('number')
    },
  )

  it(
    'test transform util function',
    async () => {
      /**
       * 读取 ./codetxt/sign-in.txt 文件内容
       */
      const sourceCode = fs.readFileSync(path.resolve('src/codetxt/sign-in.txt')).toString()
      const result = (await pluginPack() as any)?.transform(sourceCode, 'src/codetxt/sign-in.ts')
      expect(result).contain('export async function signIn')
      expect(result).contain('-sign-in-signIn\'')
    },
  )

  it(
    'find pipe assignments',
    () => {
      const sourceCode = `
const accc = pipe(zodResolver(z.object({
    name: z.string(),
    age: z.number(),
})), (i) => {
    console.log(i.name)
    return 123
})
`
      const sourceFile = ts.createSourceFile(
        'example.ts',
        sourceCode,
        ts.ScriptTarget.ESNext,
        true,
      )
      const assignments = findPipeAssignments(sourceFile)
      expect(assignments.length).eq(1)
      expect(assignments[0]).eq('accc')
    },
  )
})
