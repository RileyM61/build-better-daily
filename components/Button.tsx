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
                        'bg-wip-gold text-wip-dark hover:bg-wip-gold-dark shadow-[0_0_20px_-5px_var(--wip-gold)] hover:shadow-[0_0_25px_-5px_var(--wip-gold)]': variant === 'primary',
                        'bg-wip-card text-white hover:bg-wip-border': variant === 'secondary',
                        'border-2 border-wip-border text-wip-muted hover:border-wip-gold hover:text-white': variant === 'outline',
                        'text-wip-muted hover:text-wip-gold hover:bg-wip-gold/5': variant === 'ghost',
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
