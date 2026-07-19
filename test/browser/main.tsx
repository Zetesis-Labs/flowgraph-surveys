import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AdapterHarness } from './adapter-harness.js'

const root = document.querySelector('#root')

if (!(root instanceof HTMLElement)) {
  throw new Error('Browser harness root is missing')
}

createRoot(root).render(
  <StrictMode>
    <AdapterHarness />
  </StrictMode>,
)
