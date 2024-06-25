import type { ImportedObject } from '../types/type.ts'

/**
 * 如果函数中使用了 import 的对象，那么需要将其加载到内存中
 *
 * @param usedImports
 * @param importer
 */
export function loadImportIdentifier(usedImports: ImportedObject[], importer: any) {
  const importIdentifiers: string[] = []
  return usedImports
    .filter(it => it !== null)
    .map((usedImport) => {
      if (importIdentifiers.includes(usedImport.identifier))
        return null

      importIdentifiers.push(usedImport.identifier)
      if (usedImport.type === 'named') {
        return {
          identifier: usedImport.identifier,
          data: importer(usedImport.moduleName).then(
            (m: any) => m[usedImport.identifier],
          ),
        }
      }
      if (usedImport.type === 'default') {
        return {
          identifier: usedImport.identifier,
          data: importer(usedImport.moduleName).then((m: any) => m.default),
        }
      }
      return null
    })
    .filter(Boolean)
}
