import {mergeFiles} from "./merge-files.ts";
import {convertToReactRouterDomV6_3} from "./convert-to-v-module/react-router-dom/v6.3";
import {convertToDataRoutes} from "./data-routes/convert.ts";

type Options = {
	defaultMeta?: any,
	pages: string[],
}

function generate ({ defaultMeta, pages }: Options) {
	const fileMap = mergeFiles({
		dirs: pages,
	})
	const dataRoutes = convertToDataRoutes(fileMap)
	return convertToReactRouterDomV6_3(dataRoutes, defaultMeta)
}

export {
	generate
}
