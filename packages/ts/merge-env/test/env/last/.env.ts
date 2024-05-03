import type { EnvType } from '../common/.env'
import type { DeepPartial } from '../../../../types'

const envConfig: DeepPartial<EnvType> = {
	merge: {
		dir: 'last',
	},
}

export default envConfig
