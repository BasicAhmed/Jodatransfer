import { getRates } from "@/lib/rates";
import { getContactSettings, getDisabledFlows } from "@/lib/settings";
import { ContactProvider } from "@/components/ContactContext";
import WhatsAppFab from "@/components/WhatsAppFab";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import RateTicker from "@/components/RateTicker";
import RatesTable from "@/components/RatesTable";
import Calculator from "@/components/Calculator";
import WhyChoose from "@/components/WhyChoose";
import HowItWorks from "@/components/HowItWorks";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

// Always read the latest rates on every visit. The old 60-second page cache
// meant visitors could keep seeing old prices after an admin update, and if
// one Firestore read failed, the placeholder seed prices got cached instead.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [rates, disabledFlows, contact] = await Promise.all([getRates(), getDisabledFlows(), getContactSettings()]);

  return (
    <ContactProvider value={contact}>
      <Nav />
      <Hero />
      <Calculator rates={rates} disabledFlows={disabledFlows} />
      <RateTicker rates={rates} disabledFlows={disabledFlows} />
      <RatesTable rates={rates} disabledFlows={disabledFlows} />
      <WhyChoose />
      <HowItWorks />
      <Reviews />
      <FAQ />
      <Contact />
      <Footer />
      <WhatsAppFab />
    </ContactProvider>
  );
}
