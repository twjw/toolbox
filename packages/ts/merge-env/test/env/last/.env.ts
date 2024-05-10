import type { EnvType } from '../common/.env'
import type { DeepPartial } from '../../../../types'
import { LAST_ENV_DIR } from '@/alias/constants'

const envConfig: DeepPartial<EnvType> = {
	merge: {
		dir: LAST_ENV_DIR,
	},
}

export default envConfig
