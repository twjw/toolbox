import type { EnvType } from './.env'
import type { DeepPartial } from '../../../../types'

const envConfig: DeepPartial<EnvType> = {
	merge: {
		name: '.env.production.ts',
	},
}

export default envConfig
