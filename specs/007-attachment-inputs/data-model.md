# Data Model: Attachment Inputs

## AttachmentQuestion

| Field | Meaning | Validation |
|------|---------|------------|
| `kind` | Attachment discriminator | Exactly `attachment` |
| `id` | Stable question identity | Existing question-id rules |
| `text` | Localizable prompt | Existing text-reference rules |
| `required` | Whether an empty answer blocks navigation | Optional boolean |
| `visibleWhen` | Existing conditional visibility | Existing well-foundedness rules |
| `minFiles` | Minimum accepted references | Safe integer, zero or greater |
| `maxFiles` | Maximum accepted references | Safe integer, not below `minFiles` |
| `accept` | Exact accepted media types | Non-empty unique strings |
| `maxFileSize` | Inclusive per-file limit | Non-negative safe integer |

## AttachmentRef

| Field | Meaning | Validation |
|------|---------|------------|
| `id` | Opaque shell-minted identity | Non-empty attachment id |
| `name` | Human-readable file name | Non-empty string |
| `mediaType` | Declared exact media type | Non-empty string |
| `size` | Byte size | Non-negative safe integer |

An attachment answer is an ordered readonly array of `AttachmentRef`. It is serialized
inside the existing answer value and `ANSWERED` event without binary content.

## AttachmentFileStore

The adapter store maps each attachment id to one reference and one host file object.
It supports `put`, `get`, `has`, `delete`, `retain`, and `clear`. `retain` removes
entries no longer present in the accepted governed answer.

## State transitions

```text
No accepted references
  → propose files
  → validate metadata
  → accepted answer + store insertion
  → remove/replace
  → accepted answer + store reconciliation
```

A rejected proposal leaves both accepted answer and store unchanged. Replay rebuilds
the metadata answer only; a host may request reselection when corresponding binaries
are absent.
