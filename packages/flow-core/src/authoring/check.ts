import { toNodeId, type NodeId, type QuestionId } from '../domain/ids.js'
import type { SchemaProblem, SchemaProblemCode } from '../domain/problem.js'
import type { FlowSchema, Guard, NumericExpr, Question } from '../domain/schema.js'

type QuestionLocation = {
  readonly page: NodeId
  readonly index: number
  readonly question: Question
}

type Reference = {
  readonly q: QuestionId
  readonly expected?: Question['kind']
  readonly option?: string
}

const suggestionFor = (code: SchemaProblemCode): string =>
  ({
    'missing-entry': 'Point entry to an existing page node.',
    'entry-not-page': 'Insert a page as the schema entry.',
    'dangling-node': 'Create the target node or update the edge target.',
    'unreachable-node': 'Connect this node from the entry or remove it.',
    'no-terminal-reachable': 'Add a directed path from this page to a terminal.',
    'cycle-detected': 'Remove the cyclic edge; core v1 graphs must be acyclic.',
    'duplicate-question': 'Give every question a schema-wide unique id.',
    'duplicate-option': 'Give every option in this question a unique id.',
    'duplicate-edge-target': 'Combine same-target guards with any([...]).',
    'shadowed-edge': 'Move the unconditional edge to the final position.',
    'ill-founded-visibility': 'Reference only earlier or strict-ancestor questions.',
    'invalid-expression-reference': 'Reference an existing question of the required kind.',
    'invalid-constraint': 'Correct the contradictory or negative constraint.',
    'missing-default-edge': 'Add a final always edge or prove every assignment with probe().',
    'empty-all': 'Replace the empty conjunction with an explicit always guard.',
    'empty-any': 'Remove the empty disjunction or add its intended operands.',
    'weight-overflow-risk': 'Reduce option weights so every possible score stays safe.',
    'probe-budget-exceeded': 'Reduce the candidate domain or split the page.',
    'semantic-dead-end': 'Add a route for the reported valid answer assignment.',
  })[code]

const issue = (
  severity: SchemaProblem['severity'],
  code: SchemaProblemCode,
  where: SchemaProblem['where'],
  details?: SchemaProblem['details'],
): SchemaProblem => ({
  severity,
  code,
  where,
  suggestion: suggestionFor(code),
  ...(details ? { details } : {}),
})

const referencesInNumeric = (expression: NumericExpr): readonly Reference[] => {
  switch (expression.kind) {
    case 'num':
      return []
    case 'answer':
      return [{ q: expression.q, expected: 'number' }]
    case 'score':
      return [{ q: expression.q, expected: 'select' }]
    case 'sum':
      return expression.values.flatMap(referencesInNumeric)
  }
}

const referencesInGuard = (guard: Guard): readonly Reference[] => {
  switch (guard.kind) {
    case 'always':
      return []
    case 'answered':
      return [{ q: guard.q }]
    case 'selected':
      return [{ q: guard.q, expected: 'select', option: guard.option }]
    case 'not':
      return referencesInGuard(guard.value)
    case 'all':
    case 'any':
      return guard.values.flatMap(referencesInGuard)
    case 'cmp':
      return [...referencesInNumeric(guard.left), ...referencesInNumeric(guard.right)]
  }
}

const emptyGuardProblems = (
  guard: Guard,
  where: SchemaProblem['where'],
): readonly SchemaProblem[] => {
  const own =
    (guard.kind === 'all' || guard.kind === 'any') && guard.values.length === 0
      ? [issue('warning', guard.kind === 'all' ? 'empty-all' : 'empty-any', where)]
      : []
  if (guard.kind === 'not') return [...own, ...emptyGuardProblems(guard.value, where)]
  if (guard.kind === 'all' || guard.kind === 'any') {
    return [...own, ...guard.values.flatMap((value) => emptyGuardProblems(value, where))]
  }
  return own
}

const canReach = (schema: FlowSchema, from: NodeId, to: NodeId): boolean => {
  const visit = (nodeId: NodeId, seen: ReadonlySet<NodeId>): boolean => {
    if (nodeId === to) return true
    if (seen.has(nodeId)) return false
    const node = schema.nodes[nodeId]
    if (node?.kind !== 'page') return false
    const nextSeen = new Set(seen).add(nodeId)
    return node.edges.some((edge) => visit(edge.to, nextSeen))
  }
  return visit(from, new Set())
}

export const check = (schema: FlowSchema): readonly SchemaProblem[] => {
  const problems: SchemaProblem[] = []
  const nodes = Object.entries(schema.nodes).map(
    ([nodeId, node]) => [toNodeId(nodeId), node] as const,
  )
  const entry = schema.nodes[schema.entry]

  if (!entry) problems.push(issue('error', 'missing-entry', { node: schema.entry }))
  else if (entry.kind !== 'page') {
    problems.push(issue('error', 'entry-not-page', { node: schema.entry }))
  }

  for (const [nodeId, node] of nodes) {
    if (node.kind !== 'page') continue
    const targets = new Map<NodeId, number>()
    const alwaysIndex = node.edges.findIndex(({ when }) => when.kind === 'always')
    node.edges.forEach((edge, edgeIndex) => {
      if (!schema.nodes[edge.to]) {
        problems.push(
          issue('error', 'dangling-node', { node: nodeId, edge: edgeIndex, to: edge.to }),
        )
      }
      const first = targets.get(edge.to)
      if (first !== undefined) {
        problems.push(
          issue('error', 'duplicate-edge-target', { node: nodeId, edge: edgeIndex, first }),
        )
      } else {
        targets.set(edge.to, edgeIndex)
      }
      if (alwaysIndex >= 0 && edgeIndex > alwaysIndex) {
        problems.push(issue('error', 'shadowed-edge', { node: nodeId, edge: edgeIndex }))
      }
      problems.push(...emptyGuardProblems(edge.when, { node: nodeId, edge: edgeIndex }))
    })
    if (alwaysIndex < 0) {
      problems.push(issue('warning', 'missing-default-edge', { node: nodeId }))
    }
  }

  const reachable = new Set<NodeId>()
  const collectReachable = (nodeId: NodeId): void => {
    const node = schema.nodes[nodeId]
    if (reachable.has(nodeId) || !node) return
    reachable.add(nodeId)
    if (node.kind === 'page') node.edges.forEach(({ to }) => collectReachable(to))
  }
  collectReachable(schema.entry)
  for (const [nodeId] of nodes) {
    if (!reachable.has(nodeId)) {
      problems.push(issue('error', 'unreachable-node', { node: nodeId }))
    }
  }

  const colour = new Map<NodeId, 'gray' | 'black'>()
  const visitCycle = (nodeId: NodeId, stack: readonly NodeId[]): void => {
    const node = schema.nodes[nodeId]
    if (!node || colour.get(nodeId) === 'black') return
    colour.set(nodeId, 'gray')
    if (node.kind === 'page') {
      node.edges.forEach(({ to }) => {
        if (colour.get(to) === 'gray') {
          const start = stack.indexOf(to)
          const cycle = [...(start >= 0 ? stack.slice(start) : stack), nodeId, to]
          problems.push(issue('error', 'cycle-detected', { node: nodeId, to }, { cycle }))
        } else {
          visitCycle(to, [...stack, nodeId])
        }
      })
    }
    colour.set(nodeId, 'black')
  }
  nodes.forEach(([nodeId]) => visitCycle(nodeId, []))

  const predecessors = new Map<NodeId, NodeId[]>()
  const terminalReachable = new Set<NodeId>()
  nodes.forEach(([nodeId, node]) => {
    if (node.kind === 'terminal') terminalReachable.add(nodeId)
    if (node.kind !== 'page') return
    node.edges.forEach(({ to }) => {
      const previous = predecessors.get(to) ?? []
      predecessors.set(to, [...previous, nodeId])
    })
  })
  const queue = [...terminalReachable]
  for (const nodeId of queue) {
    for (const predecessor of predecessors.get(nodeId) ?? []) {
      if (terminalReachable.has(predecessor)) continue
      terminalReachable.add(predecessor)
      queue.push(predecessor)
    }
  }
  for (const [nodeId, node] of nodes) {
    if (node.kind === 'page' && !terminalReachable.has(nodeId)) {
      problems.push(issue('error', 'no-terminal-reachable', { node: nodeId }))
    }
  }

  const questions = new Map<QuestionId, QuestionLocation>()
  for (const [page, node] of nodes) {
    if (node.kind !== 'page') continue
    node.questions.forEach((question, index) => {
      const first = questions.get(question.id)
      if (first) {
        problems.push(
          issue('error', 'duplicate-question', {
            node: page,
            question: question.id,
            firstNode: first.page,
          }),
        )
      } else {
        questions.set(question.id, { page, index, question })
      }
      if (question.kind === 'select') {
        const options = new Set<string>()
        question.options.forEach(({ id }, option) => {
          if (options.has(id)) {
            problems.push(
              issue('error', 'duplicate-option', {
                node: page,
                question: question.id,
                option,
              }),
            )
          }
          options.add(id)
        })
        if (question.multiple) {
          const weights = question.options.map(({ weight }) => weight ?? 0)
          const positive = weights
            .filter((weight) => weight > 0)
            .reduce<number>((sum, value) => sum + value, 0)
          const negative = weights
            .filter((weight) => weight < 0)
            .reduce<number>((sum, value) => sum + value, 0)
          if (!Number.isSafeInteger(positive) || !Number.isSafeInteger(negative)) {
            problems.push(
              issue('warning', 'weight-overflow-risk', { node: page, question: question.id }),
            )
          }
        }
      }
      if (
        (question.kind === 'number' &&
          question.min !== undefined &&
          question.max !== undefined &&
          question.min > question.max) ||
        (question.kind === 'text' && question.maxLength !== undefined && question.maxLength < 0) ||
        (question.kind === 'attachment' &&
          ((question.minFiles !== undefined && question.minFiles < 0) ||
            (question.maxFiles !== undefined && question.maxFiles < 0) ||
            (question.minFiles !== undefined &&
              question.maxFiles !== undefined &&
              question.minFiles > question.maxFiles) ||
            (question.maxFileSize !== undefined && question.maxFileSize < 0) ||
            (question.accept !== undefined &&
              (question.accept.some((mediaType) => mediaType.length === 0) ||
                new Set(question.accept).size !== question.accept.length))))
      ) {
        problems.push(issue('error', 'invalid-constraint', { node: page, question: question.id }))
      }
    })
  }

  const inspectReferences = (
    guard: Guard,
    page: NodeId,
    where: SchemaProblem['where'],
    visibilityIndex?: number,
  ): void => {
    for (const reference of referencesInGuard(guard)) {
      const location = questions.get(reference.q)
      if (
        !location ||
        (reference.expected && location.question.kind !== reference.expected) ||
        (reference.option &&
          location.question.kind === 'select' &&
          !location.question.options.some(({ id }) => id === reference.option))
      ) {
        problems.push(
          issue('error', 'invalid-expression-reference', { ...where, question: reference.q }),
        )
        continue
      }
      const isEarlier = location.page === page && location.index < (visibilityIndex ?? Infinity)
      const isAncestor = location.page !== page && canReach(schema, location.page, page)
      if (visibilityIndex !== undefined && !isEarlier && !isAncestor) {
        problems.push(issue('error', 'ill-founded-visibility', { ...where, question: reference.q }))
      }
      if (visibilityIndex === undefined && !isEarlier && !isAncestor) {
        problems.push(
          issue('error', 'invalid-expression-reference', { ...where, question: reference.q }),
        )
      }
    }
  }

  for (const [page, node] of nodes) {
    if (node.kind !== 'page') continue
    node.questions.forEach((question, index) => {
      if (question.visibleWhen) {
        inspectReferences(question.visibleWhen, page, { node: page, question: question.id }, index)
        problems.push(
          ...emptyGuardProblems(question.visibleWhen, { node: page, question: question.id }),
        )
      }
    })
    node.edges.forEach((edge, edgeIndex) =>
      inspectReferences(edge.when, page, { node: page, edge: edgeIndex }),
    )
  }

  return problems
}
