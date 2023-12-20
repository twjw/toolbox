import {convertToDataRoutes} from "./convert-to-data-routes.ts";
import {mergeFiles} from "./merge-files.ts";
import path from "path";
import {convertToReactRouterDomV6_3} from "./convert-to-v-module/react-router-dom/v6.3";

const fileMap = mergeFiles({
  dirs: [
    path.resolve(__dirname, './test-pages/aaa'),
    path.resolve(__dirname, './test-pages/bbb'),
  ],
})
const dataRoutes = convertToDataRoutes(fileMap)
const vmStr = convertToReactRouterDomV6_3(dataRoutes)


// console.log(JSON.stringify(fileMap, null, 2))
// console.log(JSON.stringify(dataRoutes, null, 2))
// console.log(dataRoutes[3])
console.log(vmStr)
