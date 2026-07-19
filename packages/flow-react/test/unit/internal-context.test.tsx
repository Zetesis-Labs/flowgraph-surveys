import { ok, toNodeId } from '@flowgraph/core'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { TextRenderer } from '../../src/renderers/text-renderer.js'
import { qName, surveySchema } from '../support/builders.js'

describe('default renderer context', () => {
  it('throws a developer-facing error outside FlowPage draft context', () => {
    const page = surveySchema().nodes[toNodeId('profile')]
    const question =
      page?.kind === 'page' ? page.questions.find(({ id }) => id === qName) : undefined
    if (question?.kind !== 'text') throw new Error('Context fixture is missing')

    expect(() =>
      render(
        <TextRenderer
          question={question}
          text="Nombre"
          options={undefined}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={() => ok([])}
        />,
      ),
    ).toThrow('Default FlowGraph renderers require FlowPage draft context')
  })
})
