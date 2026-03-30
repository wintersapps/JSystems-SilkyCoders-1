import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[80px] w-full rounded border border-[#e3e4e5] bg-white px-3 py-2 text-base shadow-sm placeholder:text-[#7b7d80] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#16181D] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
