/**
 * Run this once to get a Google OAuth refresh token for the Tasks API.
 *
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npx tsx scripts/google-oauth-setup.ts
 */
import { google } from 'googleapis'
import * as readline from 'node:readline'

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before running this script.')
  process.exit(1)
}

const auth = new google.auth.OAuth2(clientId, clientSecret, 'urn:ietf:wg:oauth:2.0:oob')

const authUrl = auth.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/tasks'],
  prompt: 'consent',
})

console.log('\nOpen this URL in your browser and approve access:\n')
console.log(authUrl)
console.log()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('Paste the authorisation code here: ', async (code) => {
  rl.close()
  try {
    const { tokens } = await auth.getToken(code.trim())
    auth.setCredentials(tokens)

    console.log('\n✅ Refresh token (add to .env as GOOGLE_REFRESH_TOKEN):')
    console.log(tokens.refresh_token)

    // List available task lists so the user can pick the right ID
    const tasks = google.tasks({ version: 'v1', auth })
    const lists = await tasks.tasklists.list()
    console.log('\nAvailable task lists (add the ID to .env as GOOGLE_TASK_LIST_ID):')
    for (const list of lists.data.items ?? []) {
      console.log(`  ${list.title}  →  ${list.id}`)
    }
    console.log()
  } catch (err) {
    console.error('Failed to exchange code:', err)
    process.exit(1)
  }
})
