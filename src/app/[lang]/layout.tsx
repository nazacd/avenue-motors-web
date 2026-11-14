import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/jost/wght.css";
import "../globals.css";
import { BootScript } from "@/components/BootScript";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Mark } from "@/components/Mark";
import { SiteEffects } from "@/components/SiteEffects";
import { site } from "@/data/site";
import { getDictionary } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: dict.meta.title, template: `%s — ${site.name}` },
    description: dict.meta.description,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: dict.meta.title,
      description: dict.meta.description,
      locale: lang,
    },
  };
}

// Runs before the first paint. It marks that scripts work, which lets sections start
// hidden and fade in, and it skips the opening animation after the first page of a visit.
const bootScript = `(function(){var d=document.documentElement;d.classList.add("js");try{if(sessionStorage.getItem("am-intro")){d.classList.add("intro-done")}else{sessionStorage.setItem("am-intro","1")}}catch(e){}})()`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body>
        <BootScript code={bootScript} />
        <a className="skip" href="#content">
          {dict.nav.skip}
        </a>
        <div className="preloader" aria-hidden>
          <Mark className="preloader__mark" />
          <span className="preloader__streak" />
        </div>
        <Header locale={lang} labels={dict.nav} />
        <main id="content">{children}</main>
        <Footer locale={lang} dict={dict} />
        <SiteEffects />
      </body>
    </html>
  );
}
