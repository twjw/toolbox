import {type FileRoute} from "./merge-files.ts";
import {META_IDX, OUTLET_NAME, PAGE_IDX} from "./constants.ts";
import {SL} from "../../../../../constants";

type DataRoute = {
  filename: string
  rootDir: string
  parentPathList: string[]
  includesFile: {
    page: boolean
    meta: boolean
  }
  children: DataRoute[]
}

function convertToDataRoutes(
  simpleFileRouteMap: Record<string, FileRoute>,
  parentPathList = [] as string[],
  result = [] as DataRoute[],
) {
  for (const k in simpleFileRouteMap) {
    const e = simpleFileRouteMap[k]

    if (e.relateFiles[PAGE_IDX] === 1) {
      const completeFileRoute: DataRoute = {
        filename: k,
        rootDir: e.rootDir,
        parentPathList: parentPathList,
        includesFile: {
          page: !!e.relateFiles[PAGE_IDX],
          meta: !!e.relateFiles[META_IDX],
        },
        children: [],
      }

      result.push(completeFileRoute)

      const outletName = `${SL}${OUTLET_NAME}`
      if (e.children[outletName] != null) {
        convertToDataRoutes(
          e.children[outletName].children,
          parentPathList,
          completeFileRoute.children,
        )
        continue
      }
    }

    convertToDataRoutes(e.children, [...parentPathList, k], result)
  }

  return result
}

export type { DataRoute }
export {
  convertToDataRoutes
}
