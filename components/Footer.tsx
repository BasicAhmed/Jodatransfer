import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2" dir="ltr">
          <Image src="/logo-icon.png" alt="Jodatransfer" width={24} height={28} className="logo-tile h-7 w-auto" />
          <span className="font-display text-base font-bold text-ink">
            Joda<span className="text-primary">transfer</span>
          </span>
        </div>
        <p className="text-xs text-subtle">
          © {new Date().getFullYear()} Jodatransfer. الأسعار المعروضة تقريبية ويتم تأكيدها وقت الطلب.
        </p>
      </div>
    </footer>
  );
}
