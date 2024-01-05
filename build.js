import fs from 'fs'
import path from 'path'
import tsup from 'tsup'

const OUT_DIR = 'esm'
const PACKAGES = ['vite-react', 'react', 'type']

fs.rmSync(path.resolve(process.cwd(), OUT_DIR), { recursive: true, force: true })

tsup.build({
	entry: PACKAGES.map(e => `./exports/${e}.ts`),
	outDir: OUT_DIR,
	format: ['esm' /*'cjs'*/],
	splitting: true,
	clean: true,
	dts: true,
	skipNodeModulesBundle: true,
	minify: true,
	bundle: true,
})
