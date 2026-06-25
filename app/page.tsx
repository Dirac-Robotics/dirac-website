import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/sections/hero";
import { Mission } from "@/components/sections/mission";
import { Models } from "@/components/sections/models";
import { Gyms } from "@/components/sections/gyms";
import { Contact } from "@/components/sections/contact";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="relative flex-1">
        <Hero />
        <Mission />
        <Models />
        <Gyms />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
