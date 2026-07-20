# Research: Composable Schema Packs

## Public port representation

**Decision**: Entries and outlets are ordered arrays of records with explicit ids.

**Rationale**: Arrays preserve declaration order and make duplicate port ids observable,
which object maps cannot do after parsing.

**Alternatives considered**: Record maps were rejected because duplicate keys disappear
before validation. Direct cross-pack node references were rejected because they expose
private implementation ids.

## Outlet semantics

**Decision**: An outlet contains a source page, guard, and `required` flag. A connection
turns that outlet into an edge appended after internal page edges.

**Rationale**: Existing edge ordering remains normative and packs can explicitly expose
conditional continuations without adding placeholder nodes to compiled schemas.

**Alternatives considered**: Terminal replacement was rejected because it overloads
outcomes and cannot express guarded branching cleanly.

## Namespace encoding

**Decision**: Every compiled id uses a length-prefixed encoding of instance id and local
id, with a type-specific prefix.

**Rationale**: Length prefixes make the mapping injective for arbitrary strings,
including delimiters, while remaining deterministic and pure.

**Alternatives considered**: Simple concatenation was rejected because values containing
the separator can collide. Hashes were rejected because they obscure diagnostics and add
unnecessary machinery.

## Independent validation

**Decision**: Validate port structure directly, then run the existing checker against a
synthetic schema that adds a super-entry and terminal outlet sink.

**Rationale**: This reuses normative reference, visibility, reachability, and cycle
semantics while allowing pack entries/outlets to stand in for external connections.

**Alternatives considered**: Duplicating checker logic was rejected because it would
create semantic drift.

## Parameterization

**Decision**: Expose a `PackFactory<Parameters>` type for pure author-owned functions
that return fully concrete packs.

**Rationale**: Typed factories give authors arbitrary configuration power while compiled
and transported artifacts remain plain data with no expression interpreter.

**Alternatives considered**: Serialized placeholder expressions were deferred because
they would introduce a second evaluation language and substantially enlarge validation.

## Compilation result

**Decision**: Return either one complete `FlowSchema` or a readonly collection of stable
composition problems; never a partial schema.

**Rationale**: This matches the core `Result` convention and fail-closed authoring loop.
