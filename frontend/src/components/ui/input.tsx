import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full rounded border border-[#e3e4e5] bg-white px-3 py-1 text-base shadow-sm transition-colors placeholder:text-[#7b7d80] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#16181D] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
