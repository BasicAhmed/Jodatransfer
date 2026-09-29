import { getRates } from "@/lib/rates";
import { getDisabledFlows } from "@/lib/settings";
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

export const revalidate = 60; // re-fetch rates at most once a minute

export default async function Home() {
  const [rates, disabledFlows] = await Promise.all([getRates(), getDisabledFlows()]);

  return (
    <>
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
    </>
  );
}
