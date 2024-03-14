import { TsFetchTemplateDefineApis } from 'wtbx-type-safe-fetch'

export type Apis = TsFetchTemplateDefineApis<{
	'get:/dog': { response: never }
}>
