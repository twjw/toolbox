import {type FileRoute} from "./merge-files.ts";
import {META_IDX, OUTLET_NAME, PAGE_IDX} from "./constants.ts";
import {SL} from "../../../../../constants";

type DataRoute = {
  filename: string
  rootDir: string
  parentFilenames: string[]
  parentFilenameIdx: number | undefined // 父層的路由指到 parentPathList 的第 i 個
  includesFile: {
    page: boolean
    meta: boolean
  }
  children: DataRoute[]
}

function convertToDataRoutes(
  simpleFileRouteMap: Record<string, FileRoute>,
  parentFilenameIdx: number | undefined = undefined,
  parentFilenames = [] as string[],
  result = [] as DataRoute[],
) {
  for (const k in simpleFileRouteMap) {
    const e = simpleFileRouteMap[k]

    if (e.relateFiles[PAGE_IDX] === 1) {
      const completeFileRoute: DataRoute = {
        filename: k,
        rootDir: e.rootDir,
        parentFilenames,
        parentFilenameIdx,
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
          parentFilenames.length,
          [...parentFilenames, k, outletName],
          completeFileRoute.children,
        )
        continue
      }
    }

    convertToDataRoutes(e.children, parentFilenameIdx, [...parentFilenames, k], result)
  }

  return result
}

export type { DataRoute }
export {
  convertToDataRoutes
}
