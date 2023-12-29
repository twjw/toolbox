import tsup from 'tsup'

const packages = ['common', 'node', 'react', 'type', 'vite', 'web']

tsup.build({
	entry: packages.map(e => `./packages/${e}/index.ts`),
	outDir: 'esm',
	format: ['esm' /*'cjs'*/],
	splitting: true,
	clean: true,
	dts: true,
	skipNodeModulesBundle: true,
	minify: true,
	bundle: true,
})
