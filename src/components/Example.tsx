import type { ReactNode } from 'react'

export function Example({ name, className = '', children }: { name: string; className?: string; children: ReactNode }) {
  return (
    <fieldset className={`relative w-full max-w-lg rounded-lg border border-gray-700 p-6 ${className}`}>
      <legend className="px-2 text-xs text-gray-500">{name}</legend>
      {children}
    </fieldset>
  )
}
