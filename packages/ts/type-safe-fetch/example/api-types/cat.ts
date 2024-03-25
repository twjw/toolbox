import { TsFetchTemplateDefineApis } from 'wtbx-type-safe-fetch'

export namespace CatImage {
	export type Params = {
		size: string
		mime_types: 'jpg' | 'png'
		format: 'json'
		has_breeds: boolean
		order: 'RANDOM'
		page: number
		limit: number
	}

	export type Response = {
		url: string
	}[]
}

export type Apis = TsFetchTemplateDefineApis<{
	'get:/:version/images/search': {
		params: CatImage.Params
		response: CatImage.Response
	}
}>
