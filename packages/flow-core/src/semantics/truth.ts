import type { Truth } from '../domain/schema.js'

export const notTruth = (value: Truth): Truth =>
  value === 'true' ? 'false' : value === 'false' ? 'true' : 'unknown'

export const allTruth = (values: readonly Truth[]): Truth =>
  values.includes('false')
    ? 'false'
    : values.every((value) => value === 'true')
      ? 'true'
      : 'unknown'

export const anyTruth = (values: readonly Truth[]): Truth =>
  values.includes('true')
    ? 'true'
    : values.every((value) => value === 'false')
      ? 'false'
      : 'unknown'
