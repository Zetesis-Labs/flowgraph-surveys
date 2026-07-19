import { hashSchema } from '@flowgraph/core'
import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFlowState } from '../../src/hooks/use-flow-state.js'
import { createMetaFactory, freshSession, surveySchema } from '../support/builders.js'

describe('session binding', () => {
  it('converges multiple consumers and leaves an unmounted consumer detached', () => {
    const schema = surveySchema()
    const session = freshSession(schema)
    const Consumer = ({ name }: { readonly name: string }) => {
      const state = useFlowState(session)
      return <output aria-label={name}>{state.status}</output>
    }
    const { rerender } = render(
      <>
        <Consumer name="first" />
        <Consumer name="second" />
      </>,
    )

    expect(screen.getByLabelText('first')).toHaveTextContent('not-started')
    expect(screen.getByLabelText('second')).toHaveTextContent('not-started')

    act(() => {
      session.dispatch({
        kind: 'START',
        schemaHash: hashSchema(schema),
        meta: createMetaFactory()(),
      })
    })
    expect(screen.getByLabelText('first')).toHaveTextContent('active')
    expect(screen.getByLabelText('second')).toHaveTextContent('active')

    rerender(<Consumer name="second" />)
    act(() => {
      session.dispatch({ kind: 'BACK', meta: createMetaFactory()() })
    })
    expect(screen.queryByLabelText('first')).not.toBeInTheDocument()
    expect(screen.getByLabelText('second')).toHaveTextContent('active')
  })
})
