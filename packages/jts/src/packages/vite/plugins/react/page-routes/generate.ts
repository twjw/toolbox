import { mergeFiles } from './merge-files'
import { convertToReactRouterDomV6_3 } from './convert-to-v-module/react-router-dom/v6.3'
import { convertToDataRoutes } from './data-routes/convert'
import { type ReactPageRoutesOptions } from './type'

function generate(options: ReactPageRoutesOptions) {
	const fileMap = mergeFiles({
		dirs: options.pages,
	})
	const dataRoutes = convertToDataRoutes(fileMap)
	return convertToReactRouterDomV6_3(dataRoutes, options)
}

export { generate }
