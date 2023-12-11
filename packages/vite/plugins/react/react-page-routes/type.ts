import type {Context, FC} from "react";

type CreatePageRouteProps = {
  Wrap: FC<{ children: Element }>
}

type PageRouteContext<T> = Context<Partial<T>>

export type {
  CreatePageRouteProps,
  PageRouteContext,
}
