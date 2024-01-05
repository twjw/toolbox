import { convertToDataRoutes } from './data-routes/convert'
import { mergeFiles } from './merge-files'
import path from 'path'
import { fileURLToPath } from 'url'

const fileMap = mergeFiles({
	dirs: [
		path.resolve(path.dirname(fileURLToPath(import.meta.url)), './test-pages/aaa'),
		path.resolve(path.dirname(fileURLToPath(import.meta.url)), './test-pages/bbb'),
	],
})
const dataRoutes = convertToDataRoutes(fileMap)

// console.log(JSON.stringify(fileMap, null, 2))
// console.log(JSON.stringify(dataRoutes, null, 2))
// removeDataRoute(dataRoutes, `C:${SL}__c_frank${SL}codes${SL}side${SL}@twjw${SL}toolbox-js${SL}packages${SL}vite${SL}plugins${SL}react${SL}page-routes${SL}test-pages${SL}bbb${SL}task${SL}detail${SL}(outlet)${SL}doing${SL}page.tsx`.replace(/[\\/][^\\/]+$/, ''))
// console.log(`${SL}doing${SL}page.tsx`.replace(/[\\/][^\\/]+$/, ''))
