import type {FC, ReactNode} from 'react'
import type {WObject} from "../../../../type";

namespace WtbxI18n {
  export type Translate = <Dictionary extends Record<string, any>>(key: WObject.RecursiveKeyOf<Dictionary>, value?: string[]) => string

  export type Register = <Locale>(options: { default: Locale }) => void

  export type SetLocale = <Locale>(locale: Locale) => Promise<void>

  export type App = FC<{ fallback?: ReactNode, children: ReactNode }>
}

export type {
  WtbxI18n
}
