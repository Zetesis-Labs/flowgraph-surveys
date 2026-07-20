# Data Model: Composable Schema Packs

## FlowPack

| Field | Meaning |
|------|---------|
| `id` | Stable pack identity |
| `version` | Concrete pack version |
| `entry` | Id of the default public entry |
| `entries` | Ordered named entry records |
| `nodes` | Private ordinary schema nodes |
| `outlets` | Ordered conditional external edge declarations |

## PackEntry

| Field | Meaning |
|------|---------|
| `id` | Public port identity |
| `node` | Private local node reached by the entry |

## PackOutlet

| Field | Meaning |
|------|---------|
| `id` | Public port identity |
| `from` | Private source page |
| `when` | Existing kernel guard |
| `required` | Whether compilation requires a binding |

## PackInstance

| Field | Meaning |
|------|---------|
| `id` | Composition-local identity and namespace seed |
| `pack` | One fully concrete pack |

## PackTarget

| Field | Meaning |
|------|---------|
| `instance` | Target instance |
| `entry` | Named target entry; defaults are represented explicitly |

## PackConnection

| Field | Meaning |
|------|---------|
| `from.instance` | Source instance |
| `from.outlet` | Named source outlet |
| `to` | Named target entry |

Connections are ordered. At most one connection may bind a given instance/outlet pair.

## FlowComposition

| Field | Meaning |
|------|---------|
| `id` | Final schema identity |
| `version` | Final schema version |
| `entry` | Named instance entry for the final schema |
| `instances` | Ordered pack instances |
| `connections` | Ordered cross-pack bindings |

## CompositionProblem

A problem has a stable error code, a structured location containing relevant
instance/pack/port/connection coordinates, and optional details. Compilation returns
all safely discoverable problems together.

## Identity transformation

```text
compiled-id = type-prefix + length(instance-id) + instance-id
              + length(local-id) + local-id
```

Node, question, option, and outcome identity spaces use different prefixes. Text keys
and fallbacks remain unchanged because they are presentation references, not schema ids.
