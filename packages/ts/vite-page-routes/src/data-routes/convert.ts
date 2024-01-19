import path from "path";
import { type FileRoute } from '../merge-files'
import { META_IDX, OUTLET_NAME, PAGE_IDX } from '../constants'
import { type DataRoute } from './type'

const SL = path.normalize('/')

function convertToDataRoutes(
	simpleFileRouteMap: Record<string, FileRoute>,
	parentFilenameIdx: number | undefined = undefined,
	parentFilenames = [] as string[],
	result = [] as DataRoute[],
) {
	const nameRouteFilenames: string[] = [] // xxx
	const dynamicRouteFilenames: string[] = [] // [xxx]
	let sortFilenames: string[] // [...nameRouteFilenames, ...dynamicRouteFilenames]

	for (const relativeFilepath in simpleFileRouteMap) {
		if (relativeFilepath[0] === '[') {
			dynamicRouteFilenames.push(relativeFilepath)
		} else {
			nameRouteFilenames.push(relativeFilepath)
		}
	}

	sortFilenames = nameRouteFilenames.concat(dynamicRouteFilenames)

	for (let i = 0; i < sortFilenames.length; i++) {
		const filename = sortFilenames[i]
		const fileRoute = simpleFileRouteMap[filename]

		if (fileRoute.relateFiles[PAGE_IDX] != null) {
			const completeFileRoute: DataRoute = {
				filename: filename,
				parentFilenames,
				parentFilenameIdx,
				relateFileIdxes: {
					page: fileRoute.relateFiles[PAGE_IDX],
					meta: fileRoute.relateFiles[META_IDX],
				},
				children: [],
			}

			result.push(completeFileRoute)

			const outletName = `${SL}${OUTLET_NAME}`
			if (fileRoute.children[outletName] != null) {
				convertToDataRoutes(
					fileRoute.children[outletName].children,
					parentFilenames.length,
					[...parentFilenames, filename, outletName],
					completeFileRoute.children,
				)
				continue
			}
		}

		convertToDataRoutes(
			fileRoute.children,
			parentFilenameIdx,
			[...parentFilenames, filename],
			result,
		)
	}

	return result
}

export type { DataRoute }
export { convertToDataRoutes }
