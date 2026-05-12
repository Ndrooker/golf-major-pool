import { useState } from 'react'
import { RulesPage } from './RulesPage'

type Props = {
  poolTitle: string
  onContinue: (firstName: string, lastName: string) => void
}

export function WelcomePage({ poolTitle, onContinue }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const canContinue = firstName.trim() !== '' && lastName.trim() !== ''

  return (
    <div className="mt-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white sm:text-2xl">
          Welcome to the {poolTitle}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Read the rules below, enter your name, and pick your team.
        </p>
      </div>

      <RulesPage />

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-5">
        <h3 className="text-center text-sm font-semibold text-white">
          Ready to pick your team?
        </h3>
        <p className="mt-1 text-center text-xs text-zinc-500">
          Enter your name below to get started.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
        <button
          type="button"
          onClick={() => onContinue(firstName.trim(), lastName.trim())}
          disabled={!canContinue}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Let's Pick
        </button>
      </div>
    </div>
  )
}
