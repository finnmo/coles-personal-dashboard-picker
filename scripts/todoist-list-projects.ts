/**
 * Lists your Todoist projects so you can find the correct TODOIST_PROJECT_ID.
 *
 *   TODOIST_API_TOKEN=xxx npx tsx scripts/todoist-list-projects.ts
 */

async function main() {
  const token = process.env.TODOIST_API_TOKEN
  if (!token) {
    console.error('Set TODOIST_API_TOKEN before running this script.')
    process.exit(1)
  }

  const res = await fetch('https://api.todoist.com/api/v1/projects', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    console.error(`Todoist API error: ${res.status} ${await res.text()}`)
    process.exit(1)
  }

  const body = (await res.json()) as { results: Array<{ id: string; name: string }> }
  const projects = body.results

  console.log('\nYour Todoist projects:\n')
  for (const p of projects) {
    console.log(`  ${p.name.padEnd(30)} id: ${p.id}`)
  }
  console.log('\nAdd the correct id to .env as TODOIST_PROJECT_ID\n')
}

main()
