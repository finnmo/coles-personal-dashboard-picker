#!/usr/bin/env npx tsx
/**
 * Interactive Google OAuth2 setup script.
 *
 * Usage:
 *   npx tsx scripts/google-oauth-setup.ts
 *
 * Prerequisites:
 *   1. Create a Google Cloud project at https://console.cloud.google.com
 *   2. Enable the "Tasks API"
 *   3. Create an OAuth2 "Desktop app" credential
 *   4. Copy the Client ID and Client Secret below when prompted
 *
 * The script will:
 *   - Print an authorization URL for you to open in a browser
 *   - Exchange the authorization code for a refresh token
 *   - Print the values to copy into your .env file
 */
import * as readline from 'readline'
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/tasks']

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n=== Google OAuth2 Setup for Household Dashboard ===\n')

  const clientId = await prompt('Google OAuth2 Client ID: ')
  const clientSecret = await prompt('Google OAuth2 Client Secret: ')

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob' // Out-of-band redirect for CLI
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to always return a refresh_token
  })

  console.log('\n1. Open this URL in your browser:\n')
  console.log(authUrl)
  console.log('\n2. Sign in with the Google account that owns your Tasks list.')
  console.log('3. Click "Allow" and copy the authorization code.\n')

  const code = await prompt('Paste the authorization code here: ')
  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    console.error(
      '\nNo refresh token returned. Make sure you used prompt: "consent" ' +
        'and revoked existing access at https://myaccount.google.com/permissions if needed.'
    )
    process.exit(1)
  }

  oauth2Client.setCredentials(tokens)

  // List available task lists so the user can find their list ID
  const tasks = google.tasks({ version: 'v1', auth: oauth2Client })
  const { data } = await tasks.tasklists.list({ maxResults: 20 })
  const lists = data.items ?? []

  console.log('\n=== Your Google Task Lists ===\n')
  for (const list of lists) {
    console.log(`  ID: ${list.id}`)
    console.log(`  Name: ${list.title}`)
    console.log()
  }

  console.log('=== Add these to your .env file ===\n')
  console.log(`GOOGLE_CLIENT_ID="${clientId}"`)
  console.log(`GOOGLE_CLIENT_SECRET="${clientSecret}"`)
  console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`)
  console.log(`GOOGLE_TASK_LIST_ID="<copy the ID of your list from above>"`)
  console.log()
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
