import {
  toNodeId,
  toOptionId,
  toOutcomeId,
  toQuestionId,
  toSchemaId,
  type NodeId,
  type OptionId,
  type OutcomeId,
  type PackInstanceId,
  type QuestionId,
} from '../domain/ids.js'
import type {
  CompositionProblem,
  FlowComposition,
  FlowPack,
  PackConnection,
  PackProblem,
} from '../domain/pack.js'
import { err, ok, type Result } from '../domain/result.js'
import type { FlowSchema, Guard, Node, NumericExpr, PageNode, Question } from '../domain/schema.js'
import { check } from './check.js'

const encoded = (prefix: string, instance: PackInstanceId, local: string): string =>
  `${prefix}${String(instance.length)}:${instance}${String(local.length)}:${local}`

export const namespaceNodeId = (instance: PackInstanceId, local: NodeId): NodeId =>
  toNodeId(encoded('n:', instance, local))

export const namespaceQuestionId = (instance: PackInstanceId, local: QuestionId): QuestionId =>
  toQuestionId(encoded('q:', instance, local))

export const namespaceOptionId = (instance: PackInstanceId, local: OptionId): OptionId =>
  toOptionId(encoded('o:', instance, local))

export const namespaceOutcomeId = (instance: PackInstanceId, local: OutcomeId): OutcomeId =>
  toOutcomeId(encoded('r:', instance, local))

const packProblem = (
  code: PackProblem['code'],
  where: PackProblem['where'],
  details?: PackProblem['details'],
): PackProblem => ({ code, where, ...(details === undefined ? {} : { details }) })

const compositionProblem = (
  code: CompositionProblem['code'],
  where: CompositionProblem['where'],
  details?: CompositionProblem['details'],
): CompositionProblem => ({ code, where, ...(details === undefined ? {} : { details }) })

const uniqueNodeId = (pack: FlowPack, label: string): NodeId => {
  let sequence = 0
  let candidate = toNodeId(`__flowgraph_pack_${label}_${String(sequence)}`)
  while (pack.nodes[candidate] !== undefined) {
    sequence += 1
    candidate = toNodeId(`__flowgraph_pack_${label}_${String(sequence)}`)
  }
  return candidate
}

export const checkPack = (pack: FlowPack): readonly PackProblem[] => {
  const problems: PackProblem[] = []
  const ports = new Map<string, 'entry' | 'outlet'>()
  const entries = new Map(pack.entries.map((entry) => [entry.id, entry] as const))

  pack.entries.forEach((entry, index) => {
    const first = ports.get(entry.id)
    if (first !== undefined) {
      problems.push(packProblem('duplicate-port', { port: entry.id, entry: index, first }))
    } else {
      ports.set(entry.id, 'entry')
    }
    if (pack.nodes[entry.node]?.kind !== 'page') {
      problems.push(packProblem('unknown-entry-node', { port: entry.id, node: entry.node }))
    }
  })
  pack.outlets.forEach((outlet, index) => {
    const first = ports.get(outlet.id)
    if (first !== undefined) {
      problems.push(packProblem('duplicate-port', { port: outlet.id, outlet: index, first }))
    } else {
      ports.set(outlet.id, 'outlet')
    }
    if (pack.nodes[outlet.from]?.kind !== 'page') {
      problems.push(packProblem('outlet-not-page', { port: outlet.id, node: outlet.from }))
    }
  })
  if (!entries.has(pack.entry)) {
    problems.push(packProblem('missing-default-entry', { port: pack.entry }))
  }

  const validEntries = [...new Set(pack.entries)]
    .map(({ node }) => node)
    .filter((node, index, values) => {
      return pack.nodes[node]?.kind === 'page' && values.indexOf(node) === index
    })
  if (validEntries.length === 0) return problems

  const superEntry = uniqueNodeId(pack, 'entry')
  const syntheticNodes: Record<string, Node> = { ...pack.nodes }
  syntheticNodes[superEntry] = {
    kind: 'page',
    questions: [],
    edges: validEntries.map((to) => ({ to, when: { kind: 'any', values: [] } })),
  }
  pack.outlets.forEach((outlet, index) => {
    const source = syntheticNodes[outlet.from]
    if (source?.kind !== 'page') return
    const terminal = uniqueNodeId({ ...pack, nodes: syntheticNodes }, `outlet_${String(index)}`)
    syntheticNodes[terminal] = {
      kind: 'terminal',
      outcome: toOutcomeId(`__flowgraph_pack_outlet_${String(index)}`),
    }
    syntheticNodes[outlet.from] = {
      ...source,
      edges: [...source.edges, { to: terminal, when: outlet.when }],
    }
  })
  const synthetic: FlowSchema = {
    id: toSchemaId(pack.id),
    version: pack.version,
    entry: superEntry,
    nodes: syntheticNodes,
  }
  check(synthetic)
    .filter(({ severity, where }) => severity === 'error' && where.node !== superEntry)
    .forEach((schemaIssue) => {
      problems.push(
        packProblem(
          'invalid-pack-schema',
          { ...schemaIssue.where },
          { schemaCode: schemaIssue.code },
        ),
      )
    })
  return problems
}

const rewriteNumeric = (instance: PackInstanceId, expression: NumericExpr): NumericExpr => {
  switch (expression.kind) {
    case 'num':
      return expression
    case 'answer':
      return { ...expression, q: namespaceQuestionId(instance, expression.q) }
    case 'score':
      return { ...expression, q: namespaceQuestionId(instance, expression.q) }
    case 'sum':
      return {
        ...expression,
        values: expression.values.map((value) => rewriteNumeric(instance, value)),
      }
  }
}

const rewriteGuard = (instance: PackInstanceId, guard: Guard): Guard => {
  switch (guard.kind) {
    case 'always':
      return guard
    case 'answered':
      return { ...guard, q: namespaceQuestionId(instance, guard.q) }
    case 'selected':
      return {
        ...guard,
        q: namespaceQuestionId(instance, guard.q),
        option: namespaceOptionId(instance, guard.option),
      }
    case 'not':
      return { ...guard, value: rewriteGuard(instance, guard.value) }
    case 'all':
    case 'any':
      return { ...guard, values: guard.values.map((value) => rewriteGuard(instance, value)) }
    case 'cmp':
      return {
        ...guard,
        left: rewriteNumeric(instance, guard.left),
        right: rewriteNumeric(instance, guard.right),
      }
  }
}

const rewriteQuestion = (instance: PackInstanceId, question: Question): Question => {
  const common = {
    ...question,
    id: namespaceQuestionId(instance, question.id),
    ...(question.visibleWhen === undefined
      ? {}
      : { visibleWhen: rewriteGuard(instance, question.visibleWhen) }),
  }
  return question.kind === 'select'
    ? {
        ...common,
        kind: question.kind,
        options: question.options.map((option) => ({
          ...option,
          id: namespaceOptionId(instance, option.id),
        })),
      }
    : common
}

const rewriteNode = (instance: PackInstanceId, node: Node): Node =>
  node.kind === 'terminal'
    ? { ...node, outcome: namespaceOutcomeId(instance, node.outcome) }
    : {
        ...node,
        questions: node.questions.map((question) => rewriteQuestion(instance, question)),
        edges: node.edges.map((edge) => ({
          to: namespaceNodeId(instance, edge.to),
          when: rewriteGuard(instance, edge.when),
        })),
      }

const bindingKey = (connection: PackConnection['from']): string =>
  encoded('b:', connection.instance, connection.outlet)

export const compileComposition = (
  composition: FlowComposition,
): Result<FlowSchema, readonly CompositionProblem[]> => {
  const problems: CompositionProblem[] = []
  const instances = new Map<PackInstanceId, FlowComposition['instances'][number]>()
  const checkedPacks = new Map<FlowPack, readonly PackProblem[]>()

  composition.instances.forEach((instance, index) => {
    if (instances.has(instance.id)) {
      problems.push(compositionProblem('duplicate-instance', { instance: instance.id, index }))
      return
    }
    instances.set(instance.id, instance)
    let packProblems = checkedPacks.get(instance.pack)
    if (packProblems === undefined) {
      packProblems = checkPack(instance.pack)
      checkedPacks.set(instance.pack, packProblems)
    }
    packProblems.forEach((problem) => {
      problems.push(
        compositionProblem(
          'invalid-pack',
          { instance: instance.id, pack: instance.pack.id, ...problem.where },
          { packCode: problem.code, ...problem.details },
        ),
      )
    })
  })

  const resolveEntry = (
    target: FlowComposition['entry'],
    missingInstanceCode: 'unknown-entry-instance' | 'unknown-target-instance',
    missingPortCode: 'unknown-entry-port' | 'unknown-target-entry',
    where: Readonly<Record<string, string | number>>,
  ) => {
    const instance = instances.get(target.instance)
    if (instance === undefined) {
      problems.push(compositionProblem(missingInstanceCode, where))
      return undefined
    }
    const entry = instance.pack.entries.find(({ id }) => id === target.entry)
    if (entry === undefined) {
      problems.push(compositionProblem(missingPortCode, where))
      return undefined
    }
    return { instance, entry }
  }

  const root = resolveEntry(composition.entry, 'unknown-entry-instance', 'unknown-entry-port', {
    instance: composition.entry.instance,
    port: composition.entry.entry,
  })
  const bound = new Set<string>()
  const validConnections: {
    readonly sourceInstance: FlowComposition['instances'][number]
    readonly targetInstance: FlowComposition['instances'][number]
    readonly outlet: FlowPack['outlets'][number]
    readonly target: FlowPack['entries'][number]
  }[] = []
  composition.connections.forEach((connection, index) => {
    const sourceInstance = instances.get(connection.from.instance)
    let source:
      | {
          readonly instance: FlowComposition['instances'][number]
          readonly outlet: FlowPack['outlets'][number]
        }
      | undefined
    if (sourceInstance === undefined) {
      problems.push(
        compositionProblem('unknown-source-instance', {
          connection: index,
          instance: connection.from.instance,
        }),
      )
    } else {
      const outlet = sourceInstance.pack.outlets.find(({ id }) => id === connection.from.outlet)
      if (outlet === undefined) {
        problems.push(
          compositionProblem('unknown-outlet', {
            connection: index,
            instance: connection.from.instance,
            port: connection.from.outlet,
          }),
        )
      } else {
        const key = bindingKey(connection.from)
        if (bound.has(key)) {
          problems.push(
            compositionProblem('duplicate-outlet-binding', {
              connection: index,
              instance: connection.from.instance,
              port: connection.from.outlet,
            }),
          )
        } else {
          bound.add(key)
          source = { instance: sourceInstance, outlet }
        }
      }
    }
    const target = resolveEntry(connection.to, 'unknown-target-instance', 'unknown-target-entry', {
      connection: index,
      instance: connection.to.instance,
      port: connection.to.entry,
    })
    if (source !== undefined && target !== undefined) {
      validConnections.push({
        sourceInstance: source.instance,
        targetInstance: target.instance,
        outlet: source.outlet,
        target: target.entry,
      })
    }
  })

  instances.forEach(({ id, pack }) => {
    pack.outlets.forEach((outlet) => {
      if (outlet.required === true && !bound.has(bindingKey({ instance: id, outlet: outlet.id }))) {
        problems.push(compositionProblem('unconnected-outlet', { instance: id, port: outlet.id }))
      }
    })
  })
  if (problems.length > 0 || root === undefined) return err(problems)

  const nodes: Record<string, Node> = {}
  instances.forEach(({ id, pack }) => {
    Object.entries(pack.nodes).forEach(([local, node]) => {
      nodes[namespaceNodeId(id, toNodeId(local))] = rewriteNode(id, node)
    })
  })
  validConnections.forEach(({ sourceInstance, targetInstance, outlet, target }) => {
    const sourceId = namespaceNodeId(sourceInstance.id, outlet.from)
    const source = nodes[sourceId] as PageNode
    nodes[sourceId] = {
      ...source,
      edges: [
        ...source.edges,
        {
          to: namespaceNodeId(targetInstance.id, target.node),
          when: rewriteGuard(sourceInstance.id, outlet.when),
        },
      ],
    }
  })
  const schema: FlowSchema = {
    id: composition.id,
    version: composition.version,
    entry: namespaceNodeId(root.instance.id, root.entry.node),
    nodes,
  }
  const invalid = check(schema).filter(({ severity }) => severity === 'error')
  if (invalid.length > 0) {
    return err(
      invalid.map((problem) =>
        compositionProblem(
          'invalid-composed-schema',
          { ...problem.where },
          { schemaCode: problem.code },
        ),
      ),
    )
  }
  return ok(schema)
}
