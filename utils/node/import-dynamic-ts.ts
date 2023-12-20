import ts from 'typescript'
import path from "path";
import fs from "fs";

function _tsCompile(source: string): string {
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext }}).outputText;
}

async function importDynamicTs <T = any>(filepath: string): Promise<T> {
  const importPath = `./${path.relative(process.cwd(), filepath).replace(/\\/g, '/')}`
  const jsText = _tsCompile(await fs.readFileSync(filepath, 'utf-8'))
  const jsFilepath = filepath.replace(/\.ts$/, '.js')
  const jsImportPath = importPath.replace(/\.ts$/, '.js')
  await fs.promises.writeFile(jsFilepath, jsText)
  const result = await import(jsImportPath) as T
  fs.promises.rm(jsFilepath)
  return result
}

export {
  importDynamicTs
}
