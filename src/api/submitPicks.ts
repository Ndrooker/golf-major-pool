export type SubmitResult = {
  ok: boolean
  error?: string
}

export async function submitPicks(
  submitUrl: string,
  name: string,
  picks: string[],
): Promise<SubmitResult> {
  try {
    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ name, picks }),
    })
    const data = await res.json()
    return { ok: !!data.ok, error: data.error }
  } catch {
    return { ok: false, error: 'Network error — check your connection and try again.' }
  }
}
