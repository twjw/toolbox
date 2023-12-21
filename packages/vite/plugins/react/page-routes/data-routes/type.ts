type DataRoute = {
  filename: string
  parentFilenames: string[]
  parentFilenameIdx: number | undefined // 父層的路由指到 parentPathList 的第 i 個
  relateFileIdxes: {
    page: number | undefined
    meta: number | undefined
  }
  children: DataRoute[]
}

export type {
  DataRoute
}
