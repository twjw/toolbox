import type { FC, ReactNode } from "react";

namespace ReactPageRoutes {
  export type CreatePageRoutes = (props: {
    Wrap: FC<{ children: ReactNode }>
  }) => ReactNode

  export type UsePageRute<T = undefined> = (fullPath?: string) => { path: string } & { meta: T }
}

export type {
  ReactPageRoutes
}
