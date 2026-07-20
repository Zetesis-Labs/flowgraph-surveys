import type { NodeId, PackId, PackInstanceId, PackPortId, SchemaId, SchemaVersion } from './ids.js'
import type { Guard, Node } from './schema.js'

export type PackEntry = {
  readonly id: PackPortId
  readonly node: NodeId
}

export type PackOutlet = {
  readonly id: PackPortId
  readonly from: NodeId
  readonly when: Guard
  readonly required?: boolean
}

export type FlowPack = {
  readonly id: PackId
  readonly version: SchemaVersion
  readonly entry: PackPortId
  readonly entries: readonly PackEntry[]
  readonly nodes: Readonly<Record<NodeId, Node>>
  readonly outlets: readonly PackOutlet[]
}

export type PackInstance = {
  readonly id: PackInstanceId
  readonly pack: FlowPack
}

export type PackTarget = {
  readonly instance: PackInstanceId
  readonly entry: PackPortId
}

export type PackConnection = {
  readonly from: {
    readonly instance: PackInstanceId
    readonly outlet: PackPortId
  }
  readonly to: PackTarget
}

export type FlowComposition = {
  readonly id: SchemaId
  readonly version: SchemaVersion
  readonly entry: PackTarget
  readonly instances: readonly PackInstance[]
  readonly connections: readonly PackConnection[]
}

export type PackFactory<Parameters> = (parameters: Parameters) => FlowPack

export type PackProblemCode =
  | 'duplicate-port'
  | 'missing-default-entry'
  | 'unknown-entry-node'
  | 'outlet-not-page'
  | 'invalid-pack-schema'

export type PackProblem = {
  readonly code: PackProblemCode
  readonly where: Readonly<Record<string, string | number>>
  readonly details?: Readonly<Record<string, unknown>>
}

export type CompositionProblemCode =
  | 'duplicate-instance'
  | 'unknown-entry-instance'
  | 'unknown-entry-port'
  | 'unknown-source-instance'
  | 'unknown-outlet'
  | 'unknown-target-instance'
  | 'unknown-target-entry'
  | 'duplicate-outlet-binding'
  | 'unconnected-outlet'
  | 'invalid-pack'
  | 'invalid-composed-schema'

export type CompositionProblem = {
  readonly code: CompositionProblemCode
  readonly where: Readonly<Record<string, string | number>>
  readonly details?: Readonly<Record<string, unknown>>
}
