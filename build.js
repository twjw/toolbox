import tsup from 'tsup'

const packages = ['vreact']

tsup.build({
	entry: packages.map(e => `./exports/${e}.ts`),
	outDir: 'esm',
	format: ['esm' /*'cjs'*/],
	splitting: true,
	clean: true,
	dts: true,
	skipNodeModulesBundle: true,
	minify: true,
	bundle: true,
})
