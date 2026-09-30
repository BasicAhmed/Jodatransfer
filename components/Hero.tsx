"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Zap, Headphones, Megaphone } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";
import { SELECT_PAIR_EVENT, type SelectPairDetail } from "./Calculator";
import { MESSAGES } from "@/lib/whatsapp";
import { useContact } from "./ContactContext";
import { CURRENCIES, type CurrencyCode } from "@/lib/corridors";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const STATS = [
  { icon: Zap, value: "أقل من 30 دقيقة", label: "متوسط التحويل" },
  { icon: ShieldCheck, value: "سعر مثبّت", label: "عند تأكيد الطلب" },
  { icon: Headphones, value: "واتساب", label: "دعم فوري" },
];

export default function Hero() {
  const { wa, channel } = useContact();
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Backdrop: brand glow + faint dot grid that fades out */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-fade" />
        <div className="absolute inset-0 bg-dot-grid [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <div className="container-page flex flex-col items-center pb-16 pt-14 text-center sm:pb-24 sm:pt-20">
        {/* Brand lockup: Joda · logo · Transfer */}
        <motion.div
          {...rise(0)}
          dir="ltr"
          className="flex items-center justify-center gap-[clamp(0.6rem,3vw,1.25rem)] font-display font-extrabold leading-none tracking-tight text-[clamp(2rem,9.5vw,3.75rem)]"
        >
          <span className="text-ink">Joda</span>
          <span className="relative shrink-0">
            <span aria-hidden="true" className="absolute inset-0 -z-10 scale-150 rounded-full bg-primary/30 blur-2xl" />
            <span className="block rounded-[1.4rem] border border-white/10 bg-brand-navy p-2.5 shadow-glow-lg">
              <Image
                src="/logo-icon.png"
                alt="Jodatransfer"
                width={68}
                height={80}
                className="h-[clamp(3.25rem,15vw,4.5rem)] w-auto"
                priority
              />
            </span>
          </span>
          <span className="text-gradient">Transfer</span>
        </motion.div>

        <motion.p
          {...rise(0.05)}
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3.5 py-1.5 text-xs font-semibold text-muted shadow-soft backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          أسعار محدّثة يومياً
        </motion.p>

        <motion.h1
          {...rise(0.1)}
          className="mt-5 max-w-3xl font-display text-[clamp(1.6rem,8vw,3.75rem)] font-extrabold leading-[1.3] tracking-tight text-ink"
        >
          <span className="whitespace-nowrap">تحويلاتك أسهل وأسرع</span>
          <br />
          <span className="text-gradient">مع جودة.</span>
        </motion.h1>

        <motion.p {...rise(0.15)} className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          حوّل بين الجنيه السوداني والرنقت الماليزي والجنيه المصري والريال السعودي والدرهم الإماراتي
          والروبل الروسي و USDT — في الاتجاهين، بسعر واضح وبدون جرجرة.
        </motion.p>

        <motion.div {...rise(0.2)} className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a href="#calculator" className="btn-primary px-8 py-3.5 text-sm">
            احسب تحويلك <ArrowLeft size={16} />
          </a>
          <a
            href={wa(MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp px-8 py-3.5 text-sm"
          >
            <WhatsAppIcon size={18} /> تواصل عبر واتساب
          </a>
          {channel && (
            <a
              href={channel}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-whatsapp/40 bg-whatsapp/10 px-8 py-3.5 text-sm font-bold text-ink shadow-soft transition-all hover:-translate-y-px hover:border-whatsapp/70 hover:bg-whatsapp/15"
            >
              <Megaphone size={17} className="text-whatsapp" /> قناة الواتساب للعروض
            </a>
          )}
        </motion.div>

        {/* Supported currencies */}
        <motion.div {...rise(0.25)} className="mt-8 flex flex-col items-center gap-2.5">
          <p className="text-[11px] font-medium text-subtle">اختر عملتك وابدأ الحساب</p>
          <div className="flex flex-wrap justify-center gap-2" dir="ltr">
            {Object.values(CURRENCIES).map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent<SelectPairDetail>(SELECT_PAIR_EVENT, { detail: { from: c.code as CurrencyCode } })
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface px-3 py-1.5 font-mono text-xs font-semibold text-ink shadow-soft transition-all hover:-translate-y-px hover:border-primary/60 hover:text-primary"
              >
                <span className="text-sm">{c.flag}</span>
                {c.code}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          {...rise(0.3)}
          className="card mt-10 grid w-full max-w-2xl grid-cols-3 divide-x divide-x-reverse divide-border/70 p-2"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center px-2 py-3">
              <span className="mb-2 rounded-xl bg-primary/10 p-2 text-primary">
                <Icon size={16} />
              </span>
              <span className="font-display text-sm font-bold text-ink sm:text-base">{value}</span>
              <span className="mt-0.5 text-[11px] text-subtle sm:text-xs">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
