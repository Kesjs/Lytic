import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { NoiseBackground } from '~/components/landing/NoiseBackground'
import { Navbar } from '~/components/landing/Navbar'
import { Hero } from '~/components/landing/Hero'
import { Problem } from '~/components/landing/Problem'
import { HowItWorks } from '~/components/landing/HowItWorks'
import { QuestionEngine } from '~/components/landing/QuestionEngine'
import { Metrics } from '~/components/landing/Metrics'
import { Evidence } from '~/components/landing/Evidence'
import { History } from '~/components/landing/History'
import { ValueLoop } from '~/components/landing/ValueLoop'
import { Pricing } from '~/components/landing/Pricing'
import { FAQ } from '~/components/landing/FAQ'
import { CTAFinal } from '~/components/landing/CTAFinal'
import { Footer } from '~/components/landing/Footer'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#101012] text-zinc-100 selection:bg-[#c9ab1e]/30 selection:text-white">
      {/* Texture sable gris mat feutré */}
      <NoiseBackground />

      {/* Barre de navigation moderne flottante */}
      <Navbar />

      <main className="relative z-10">
        <Hero />
        <SectionWrapper><Problem /></SectionWrapper>
        <SectionWrapper><HowItWorks /></SectionWrapper>
        <SectionWrapper><QuestionEngine /></SectionWrapper>
        <SectionWrapper><Metrics /></SectionWrapper>
        <SectionWrapper><Evidence /></SectionWrapper>
        <SectionWrapper><History /></SectionWrapper>
        <SectionWrapper><ValueLoop /></SectionWrapper>
        <SectionWrapper><Pricing /></SectionWrapper>
        <SectionWrapper><FAQ /></SectionWrapper>
        <CTAFinal />
      </main>

      <Footer />
    </div>
  )
}
