import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-wip-gold/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95',
                    {
                        // LOAD-BEARING: CTAs feel deliberate and grounded, not soft
                        'bg-wip-gold text-white font-bold hover:bg-wip-gold-dark shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]': variant === 'primary',
                        'bg-wip-card text-wip-heading font-semibold hover:bg-wip-navy border-2 border-wip-border': variant === 'secondary',
                        'border-2 border-wip-border text-wip-heading font-semibold hover:border-wip-gold hover:text-wip-gold': variant === 'outline',
                        'text-wip-muted font-medium hover:text-wip-gold hover:bg-wip-gold/10': variant === 'ghost',
                        'h-9 px-4 text-sm': size === 'sm',
                        'h-11 px-6 text-base': size === 'md',
                        'h-14 px-8 text-lg': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)

Button.displayName = 'Button'

export { Button, cn }
