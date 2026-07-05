import type { ReactNode } from 'react'

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      {children}
    </div>
  )
}
