import type { ReactNode } from 'react'
import type {WObject} from "../../../../type";

type NiceI18nTranslate = <Dictionary extends Record<string, any>>(key: WObject.RecursiveKeyOf<Dictionary>, value?: string[]) => string

type NiceI18nRegister = <Locale>(options: { default: Locale }) => void

type NiceI18nSetLocale = <Locale>(locale: Locale) => Promise<void>

type NiceI18nApp = ReactNode

export type {
  NiceI18nTranslate,
  NiceI18nRegister,
  NiceI18nSetLocale,
  NiceI18nApp,
}
