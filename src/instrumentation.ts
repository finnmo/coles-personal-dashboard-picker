export async function register() {
  // Only run validation in the Node.js runtime (not edge middleware)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertValidEnv } = await import('./lib/startup-validation')
    assertValidEnv()
  }
}
