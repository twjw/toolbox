import { createLog } from '../packages/common'
import { PACKAGE_NAME } from '../constants'

const log = createLog(PACKAGE_NAME.toUpperCase())

export { log }
