/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'core-does-not-depend-on-session',
      severity: 'error',
      from: { path: '^packages/flow-core/src' },
      to: { path: '^packages/flow-session' },
    },
    {
      name: 'session-public-core-only',
      severity: 'error',
      from: { path: '^packages/flow-session/src' },
      to: { path: '^packages/flow-core/src/(?!index\\.ts$)' },
    },
    {
      name: 'react-public-flowgraph-only',
      severity: 'error',
      from: { path: '^packages/flow-react/src' },
      to: { path: '^packages/(flow-core|flow-session)/src/(?!index\\.ts$)' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    includeOnly: '^packages',
    tsConfig: { fileName: 'tsconfig.json' },
  },
}
