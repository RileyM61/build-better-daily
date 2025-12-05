'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Mail } from 'lucide-react'
import { Button } from './Button'

export default function Hero() {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-wip-gold/10 border border-wip-gold/20 mb-8 hover:bg-wip-gold/20 transition-colors cursor-default"
                >
                    <span className="w-2 h-2 bg-wip-gold rounded-full animate-pulse" />
                    <span className="text-wip-gold text-sm font-bold tracking-wide uppercase">Clarity for Construction Leaders</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight"
                >
                    Build <span className="text-gradient-gold">Better</span><br />
                    Daily
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-lg md:text-xl text-wip-muted max-w-2xl mx-auto leading-relaxed mb-10"
                >
                    Real talk about cash flow, leadership, and building a construction business that actually works.
                    No fluff. No jargon. Just clarity.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button size="lg" className="w-full sm:w-auto gap-2 group">
                        Start Reading
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                        <Mail className="w-4 h-4" />
                        Subscribe
                    </Button>
                </motion.div>
            </div>

            {/* Decorative background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-wip-gold/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>
    )
}
