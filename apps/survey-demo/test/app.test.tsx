import { fireEvent, render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { App } from '../src/app/app.js'
import { memoryStorage } from './support/storage.js'

const begin = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /empezar la encuesta/i }))
  expect(screen.getByRole('heading', { name: /empecemos por ti/i })).toBeVisible()
}

describe('respondent demo', () => {
  it('opens with a complete local-demo introduction', () => {
    render(<App storage={memoryStorage()} />)
    expect(screen.getByRole('heading', { name: /cuéntanos cómo estás/i })).toBeVisible()
    expect(screen.getByText(/todo queda en local/i)).toBeVisible()
    expect(screen.getByText(/no ofrece evaluación, diagnóstico/i)).toBeVisible()
  })

  it('navigates the stress route and reconverges on shared preferences', async () => {
    const user = userEvent.setup()
    render(<App storage={memoryStorage()} />)
    await begin(user)
    await user.type(screen.getByLabelText(/cómo te gustaría/i), 'Alex')
    await user.click(screen.getByLabelText(/estrés y sobrecarga/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: /sobrecarga/i })).toBeVisible()

    await user.type(screen.getByLabelText(/qué intensidad/i), '7')
    fireEvent.blur(screen.getByLabelText(/qué intensidad/i))
    await user.click(screen.getByLabelText(/trabajo o estudios/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: /cómo prefieres continuar/i })).toBeVisible()
  })

  it('blocks incomplete navigation and focuses the first problem', async () => {
    const user = userEvent.setup()
    render(<App storage={memoryStorage()} />)
    await begin(user)
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(2)
    expect(screen.getByLabelText(/cómo te gustaría/i)).toHaveFocus()
    expect(screen.getByRole('heading', { name: /empecemos por ti/i })).toBeVisible()
  })

  it('restores an in-progress route after remounting', async () => {
    const user = userEvent.setup()
    const storage = memoryStorage()
    const first = render(<App storage={storage} />)
    await begin(user)
    await user.type(screen.getByLabelText(/cómo te gustaría/i), 'Luz')
    await user.click(screen.getByLabelText(/descanso y sueño/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: /tu descanso/i })).toBeVisible()
    first.unmount()

    render(<App storage={storage} />)
    expect(screen.getByRole('heading', { name: /tu descanso/i })).toBeVisible()
    await user.click(screen.getByRole('button', { name: /atrás/i }))
    expect(screen.getByDisplayValue('Luz')).toBeVisible()
    expect(screen.getByLabelText(/descanso y sueño/i)).toBeChecked()
  })

  it('preserves bounded-number and long-text input while explaining both problems', async () => {
    const user = userEvent.setup()
    render(<App storage={memoryStorage()} />)
    await begin(user)
    await user.type(screen.getByLabelText(/cómo te gustaría/i), 'Sol')
    await user.click(screen.getByLabelText(/estrés y sobrecarga/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    const intensity = screen.getByLabelText(/qué intensidad/i)
    const description = screen.getByLabelText(/situación reciente/i)
    fireEvent.change(intensity, { target: { value: '11' } })
    fireEvent.blur(intensity)
    await user.click(screen.getByLabelText(/trabajo o estudios/i))
    fireEvent.change(description, { target: { value: 'x'.repeat(481) } })
    fireEvent.blur(description)
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    expect(screen.getByText(/intervalo permitido/i)).toBeVisible()
    expect(screen.getByText(/supera la longitud permitida/i)).toBeVisible()
    expect(intensity).toHaveValue(11)
    expect(description).toHaveValue('x'.repeat(481))
    expect(intensity).toHaveFocus()
  })

  it('changes logistical routes while preserving the shared adaptation answers', async () => {
    const user = userEvent.setup()
    render(<App storage={memoryStorage()} />)
    await begin(user)
    await user.type(screen.getByLabelText(/cómo te gustaría/i), 'Kai')
    await user.click(screen.getByLabelText(/estrés y sobrecarga/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    await user.type(screen.getByLabelText(/qué intensidad/i), '5')
    await user.click(screen.getByLabelText(/trabajo o estudios/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    await user.click(screen.getByLabelText(/videollamada/i))
    await user.click(screen.getByLabelText(/tardes/i))
    await user.click(screen.getByRole('button', { name: /continuar/i }))

    await user.type(screen.getByLabelText(/minutos podrías reservar entre semana/i), '60')
    await user.type(screen.getByLabelText(/minutos durante el fin de semana/i), '45')
    await user.click(screen.getByLabelText(/conversación abierta/i))
    await user.click(screen.getByLabelText(/ejemplos y ejercicios/i))
    expect(screen.queryByText(/puntuaci|score/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: /formato con más espacio/i })).toBeVisible()

    await user.click(screen.getByRole('button', { name: /atrás/i }))
    expect(screen.getByLabelText(/minutos podrías reservar entre semana/i)).toHaveValue(60)
    const specificRequest = screen.getByLabelText(/algo concreto que quieras priorizar/i)
    await user.type(specificRequest, 'Preparar una conversación')
    fireEvent.blur(specificRequest)
    expect(screen.getByLabelText(/qué te gustaría poder llevarte/i)).toBeVisible()
    await user.type(
      screen.getByLabelText(/qué te gustaría poder llevarte/i),
      'Una siguiente acción clara',
    )
    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByRole('heading', { name: /te gustaría priorizar/i })).toBeVisible()
  })
})
