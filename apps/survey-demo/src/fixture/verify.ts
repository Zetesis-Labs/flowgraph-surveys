import {
  check,
  probe,
  runGoldens,
  type FlowSchema,
  type Guard,
  type NumericExpr,
} from '@flowgraph/core'

import { demoGoldens } from './goldens.js'
import { demoSchema } from './schema.js'

export type FixtureVerification = {
  readonly structuralProblems: ReturnType<typeof check>
  readonly probeReport: ReturnType<typeof probe>
  readonly goldenReport: ReturnType<typeof runGoldens>
  readonly primitiveInventory: ReturnType<typeof inventoryPrimitives>
  readonly valid: boolean
}

const requiredGuards = ['all', 'always', 'answered', 'any', 'cmp', 'not', 'selected']
const requiredNumerics = ['answer', 'num', 'score', 'sum']

export const inventoryPrimitives = (schema: FlowSchema) => {
  const guards = new Set<string>()
  const numerics = new Set<string>()
  const visitNumeric = (expression: NumericExpr) => {
    numerics.add(expression.kind)
    if (expression.kind === 'sum') expression.values.forEach(visitNumeric)
  }
  const visitGuard = (guard: Guard) => {
    guards.add(guard.kind)
    if (guard.kind === 'not') visitGuard(guard.value)
    if (guard.kind === 'all' || guard.kind === 'any') guard.values.forEach(visitGuard)
    if (guard.kind === 'cmp') {
      visitNumeric(guard.left)
      visitNumeric(guard.right)
    }
  }
  Object.values(schema.nodes).forEach((node) => {
    if (node.kind !== 'page') return
    node.questions.forEach(({ visibleWhen }) => {
      if (visibleWhen !== undefined) visitGuard(visibleWhen)
    })
    node.edges.forEach(({ when }) => visitGuard(when))
  })
  return {
    guards: [...guards].sort(),
    numerics: [...numerics].sort(),
  }
}

export const verifyDemoFixture = (): FixtureVerification => {
  const structuralProblems = check(demoSchema)
  const probeReport = probe(demoSchema)
  const goldenReport = runGoldens(demoSchema, demoGoldens)
  const primitiveInventory = inventoryPrimitives(demoSchema)
  return {
    structuralProblems,
    probeReport,
    goldenReport,
    primitiveInventory,
    valid:
      structuralProblems.every(({ severity }) => severity !== 'error') &&
      probeReport.problems.every(({ severity }) => severity !== 'error') &&
      goldenReport.ok &&
      goldenReport.value.cases.every(({ passed }) => passed) &&
      goldenReport.value.coverage.ratio === 1 &&
      primitiveInventory.guards.join() === requiredGuards.join() &&
      primitiveInventory.numerics.join() === requiredNumerics.join(),
  }
}
