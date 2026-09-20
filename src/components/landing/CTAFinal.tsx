import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from '~/lib/i18n/LanguageContext'

const ChatGPTLogo = () => (
  <div className="flex items-center gap-2">
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-auto drop-shadow-sm" fill="currentColor"><title>ChatGPT</title><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.073zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.0343-1.1732a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.3927-.6813zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
    <span className="text-ink-primary font-semibold text-lg tracking-tight">ChatGPT</span>
  </div>
)

const GeminiLogo = () => (
  <div className="flex items-center gap-2">
    <svg viewBox="0 0 296 298" className="h-6 w-auto drop-shadow-sm" xmlns="http://www.w3.org/2000/svg" fill="none"><title>Gemini</title><mask id="a" width="296" height="298" x="0" y="0" maskUnits="userSpaceOnUse" style={{maskType: 'alpha'}}><path fill="#3186FF" d="M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="163" cy="149" fill="#3689FF" rx="196" ry="159"/></g><g filter="url(#c)"><ellipse cx="33.5" cy="142.5" fill="#F6C013" rx="68.5" ry="72.5"/></g><g filter="url(#d)"><ellipse cx="19.5" cy="148.5" fill="#F6C013" rx="68.5" ry="72.5"/></g><g filter="url(#e)"><path fill="#FA4340" d="M194 10.5C172 82.5 65.5 134.333 22.5 135L144-66l50 76.5Z"/></g><g filter="url(#f)"><path fill="#FA4340" d="M190.5-12.5C168.5 59.5 62 111.333 19 112L140.5-89l50 76.5Z"/></g><g filter="url(#g)"><path fill="#14BB69" d="M194.5 279.5C172.5 207.5 66 155.667 23 155l121.5 201 50-76.5Z"/></g><g filter="url(#h)"><path fill="#14BB69" d="M196.5 320.5C174.5 248.5 68 196.667 25 196l121.5 201 50-76.5Z"/></g></g><defs><filter id="b" width="464" height="390" x="-69" y="-46" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="18"/></filter><filter id="c" width="265" height="273" x="-99" y="6" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32"/></filter><filter id="d" width="265" height="273" x="-113" y="12" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32"/></filter><filter id="e" width="299.5" height="329" x="-41.5" y="-130" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32"/></filter><filter id="f" width="299.5" height="329" x="-45" y="-153" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32"/></filter><filter id="g" width="299.5" height="329" x="-41" y="91" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32"/></filter><filter id="h" width="299.5" height="329" x="-39" y="132" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_69_17998" stdDeviation="32"/></filter></defs></svg>
    <span className="text-ink-primary font-semibold text-lg tracking-tight">Gemini</span>
  </div>
)

const PerplexityLogo = () => (
  <div className="flex items-center gap-2">
    <svg className="h-6 w-auto drop-shadow-sm" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><title>Perplexity</title>
      <path fill="none" stroke="#22B8CD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M24 4.5v39M13.73 16.573v-9.99L24 16.573m0 14.5L13.73 41.417V27.01L24 16.573m0 0l10.27-9.99v9.99"/>
      <path fill="none" stroke="#22B8CD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.73 31.396H9.44V16.573h29.12v14.823h-4.29"/>
      <path fill="none" stroke="#22B8CD" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M24 16.573L34.27 27.01v14.407L24 31.073"/>
    </svg>
    <span className="text-ink-primary font-semibold text-lg tracking-tight">Perplexity</span>
  </div>
)

const CopilotLogo = () => (
  <div className="flex items-center gap-2">
    <svg className="h-6 w-auto drop-shadow-sm" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <title>Microsoft Copilot</title>
      <path d="M17.533 1.829A2.528 2.528 0 0015.11 0h-.737a2.531 2.531 0 00-2.484 2.087l-1.263 6.937.314-1.08a2.528 2.528 0 012.424-1.833h4.284l1.797.706 1.731-.706h-.505a2.528 2.528 0 01-2.423-1.829l-.715-2.453z" fill="url(#c-a)" transform="translate(0 1)" />
      <path d="M6.726 20.16A2.528 2.528 0 009.152 22h1.566c1.37 0 2.49-1.1 2.525-2.48l.17-6.69-.357 1.228a2.528 2.528 0 01-2.423 1.83h-4.32l-1.54-.842-1.667.843h.497c1.124 0 2.113.75 2.426 1.84l.697 2.432z" fill="url(#c-b)" transform="translate(0 1)" />
      <path d="M15 0H6.252c-2.5 0-4 3.331-5 6.662-1.184 3.947-2.734 9.225 1.75 9.225H6.78c1.13 0 2.12-.753 2.43-1.847.657-2.317 1.809-6.359 2.713-9.436.46-1.563.842-2.906 1.43-3.742A1.97 1.97 0 0115 0" fill="url(#c-c)" transform="translate(0 1)" />
      <path d="M15 0H6.252c-2.5 0-4 3.331-5 6.662-1.184 3.947-2.734 9.225 1.75 9.225H6.78c1.13 0 2.12-.753 2.43-1.847.657-2.317 1.809-6.359 2.713-9.436.46-1.563.842-2.906 1.43-3.742A1.97 1.97 0 0115 0" fill="url(#c-d)" transform="translate(0 1)" />
      <path d="M9 22h8.749c2.5 0 4-3.332 5-6.663 1.184-3.948 2.734-9.227-1.75-9.227H17.22c-1.129 0-2.12.754-2.43 1.848a1149.2 1149.2 0 01-2.713 9.437c-.46 1.564-.842 2.907-1.43 3.743A1.97 1.97 0 019 22" fill="url(#c-e)" transform="translate(0 1)" />
      <path d="M9 22h8.749c2.5 0 4-3.332 5-6.663 1.184-3.948 2.734-9.227-1.75-9.227H17.22c-1.129 0-2.12.754-2.43 1.848a1149.2 1149.2 0 01-2.713 9.437c-.46 1.564-.842 2.907-1.43 3.743A1.97 1.97 0 019 22" fill="url(#c-f)" transform="translate(0 1)" />
      <defs>
        <radialGradient cx="85.44%" cy="100.653%" fx="85.44%" fy="100.653%" gradientTransform="scale(-.8553 -1) rotate(50.927 2.041 -1.946)" id="c-a" r="105.116%"><stop offset="9.6%" stopColor="#00AEFF" /><stop offset="77.3%" stopColor="#2253CE" /><stop offset="100%" stopColor="#0736C4" /></radialGradient>
        <radialGradient cx="18.143%" cy="32.928%" fx="18.143%" fy="32.928%" gradientTransform="scale(.8897 1) rotate(52.069 .193 .352)" id="c-b" r="95.612%"><stop offset="0%" stopColor="#FFB657" /><stop offset="63.4%" stopColor="#FF5F3D" /><stop offset="92.3%" stopColor="#C02B3C" /></radialGradient>
        <radialGradient cx="82.987%" cy="-9.792%" fx="82.987%" fy="-9.792%" gradientTransform="scale(-1 -.9441) rotate(-70.872 .142 1.17)" id="c-e" r="140.622%"><stop offset="6.6%" stopColor="#8C48FF" /><stop offset="50%" stopColor="#F2598A" /><stop offset="89.6%" stopColor="#FFB152" /></radialGradient>
        <linearGradient id="c-c" x1="39.465%" x2="46.884%" y1="12.117%" y2="103.774%"><stop offset="15.6%" stopColor="#0D91E1" /><stop offset="48.7%" stopColor="#52B471" /><stop offset="65.2%" stopColor="#98BD42" /><stop offset="93.7%" stopColor="#FFC800" /></linearGradient>
        <linearGradient id="c-d" x1="45.949%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stopColor="#3DCBFF" /><stop offset="24.7%" stopColor="#0588F7" stopOpacity="0" /></linearGradient>
        <linearGradient id="c-f" x1="83.507%" x2="83.453%" y1="-6.106%" y2="21.131%"><stop offset="5.8%" stopColor="#F8ADFA" /><stop offset="70.8%" stopColor="#A86EDD" stopOpacity="0" /></linearGradient>
      </defs>
    </svg>
    <span className="text-ink-primary font-semibold text-lg tracking-tight">Copilot</span>
  </div>
)

export function CTAFinal() {
  const { t } = useTranslation()

  return (
    <section className="border-t border-hairline border-border bg-canvas px-6 py-24 md:py-32">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <h2 className="font-display text-3xl font-medium tracking-tight text-ink-primary sm:text-4xl md:text-5xl">
          {t.ctaFinal.heading}
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-secondary sm:text-base">
          {t.ctaFinal.subheading}
        </p>

        {/* Wrapper pour simuler la bordure avec clip-path */}
        <div className="group mt-10 relative p-[1px] transition-colors duration-300 bg-border hover:bg-brand/60 [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)] shadow-xl shadow-brand/5 hover:shadow-brand/20">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2.5 bg-canvas px-8 py-4 text-sm font-medium text-ink-primary transition-colors hover:text-brand-text [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]"
          >
            <span>{t.ctaFinal.cta}</span>
            <ArrowRight className="size-4.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Logos des LLMs interrogés en couleur */}
        <div className="mt-16 flex flex-col items-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-ink-muted mb-6">
            {t.ctaFinal.models}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-90">
            <ChatGPTLogo />
            <GeminiLogo />
            <PerplexityLogo />
            <CopilotLogo />
          </div>
        </div>
      </div>
    </section>
  )
}
