import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNav />
      <main className="flex flex-1 flex-col justify-between bg-foreground text-[#F3EDE2]">
        <div className="container py-14">
          <p className="max-w-[28ch] text-xl md:text-2xl">{t.notfound_message}</p>
          <Link to="/" className="mt-8 inline-flex h-14 items-center bg-[#F3EDE2] px-7 font-display text-lg font-bold uppercase text-foreground transition-colors hover:bg-white">{t.notfound_return}</Link>
        </div>
        <p aria-hidden="true" className="select-none px-3 font-display font-extrabold leading-[0.8]" style={{ fontSize: 'clamp(200px, 40vw, 600px)', color: '#F3EDE2' }}>404</p>
      </main>
      <PublicFooter />
    </div>
  );
};

export default NotFound;
