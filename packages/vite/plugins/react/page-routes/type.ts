import type { FC, ReactNode } from "react";

namespace ReactPageRoutes {
  export type CreatePageRoutes = (props: {
    Wrap: FC<{ children: ReactNode }>
  }) => ReactNode

  export type UsePageRute<Meta = undefined> = (fullPath?: string) => { path: string } & { meta: Meta }
}

export type {
  ReactPageRoutes
}
