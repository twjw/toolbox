import {DataRoute} from "./type.ts";

function recursiveFindDataRoute (dataRoutes: DataRoute[], tap: (dr: DataRoute, parent: DataRoute | null, location: 'start' | 'end') => void | false, parent = null as DataRoute | null) {
  for (let i = 0; i < dataRoutes.length; i++) {
    const dr = dataRoutes[i]

    if (tap(dr, parent, 'start') === false) break

    if (dr.children.length > 0) {
      recursiveFindDataRoute(dr.children, tap, dr)
    }

    if (tap(dr, parent, 'end') === false) break
  }
}

export {
  recursiveFindDataRoute
}
