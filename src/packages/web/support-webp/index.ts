function supportWebp() {
	return new Promise<boolean>(resolve => {
		const img = new Image()
		img.onload = () => resolve(true)
		img.onerror = () => resolve(false)
		img.src =
			'data:image/webp;base64,UklGRiYAAABXRUJQVlA4IBoAAAAwAQCdASoBAAEAAAAAJaQAA3AA/v/e3PAAAA=='
	})
}

export { supportWebp }
