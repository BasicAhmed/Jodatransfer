import { Mail, Clock, ArrowLeft } from "lucide-react";
import { MESSAGES, whatsappLink } from "@/lib/whatsapp";
import WhatsAppIcon from "./WhatsAppIcon";

export default function Contact() {
  return (
    <section id="contact" className="border-t border-border py-20 sm:py-28">
      <div className="container-page">
        <div className="card grid gap-10 p-6 sm:p-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">تواصل معنا</p>
            <h2 className="section-heading mt-3">تكلم معنا مباشرة.</h2>
            <p className="mt-3 max-w-md text-muted">
              ردود حقيقية، مو تذاكر آلية. تواصل معنا في أي وقت خلال ساعات
              العمل وبنرد عليك بسرعة.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href={whatsappLink(MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-whatsapp/30 bg-whatsapp/10 p-4 shadow-soft transition-all hover:-translate-y-px hover:border-whatsapp/60"
            >
              <div className="rounded-xl bg-whatsapp p-2.5 text-white shadow-[0_8px_20px_-6px_rgba(37,211,102,0.6)]">
                <WhatsAppIcon size={22} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-ink">واتساب — أسرع طريقة</div>
                <div className="text-sm text-muted" dir="ltr">+974 5113 1080</div>
              </div>
              <ArrowLeft size={18} className="text-whatsapp transition-transform group-hover:-translate-x-1" />
            </a>

            <a
              href="mailto:hello@jodatransfer.com"
              className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface2 p-4 shadow-soft transition-colors hover:border-primary"
            >
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Mail size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">البريد الإلكتروني</div>
                <div className="text-sm text-muted" dir="ltr">hello@jodatransfer.com</div>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-surface2 p-4 shadow-soft">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">ساعات العمل</div>
                <div className="text-sm text-muted">السبت–الخميس، 9:00–22:00 (توقيت غرينتش+2)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
