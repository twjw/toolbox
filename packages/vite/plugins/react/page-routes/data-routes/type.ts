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

export type {
  DataRoute
}
