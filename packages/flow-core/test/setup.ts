import fc from 'fast-check'

fc.configureGlobal({
  seed: 20260719,
  numRuns: 100,
  interruptAfterTimeLimit: 10_000,
})
