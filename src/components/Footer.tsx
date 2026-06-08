import Link from "next/link";
import { Youtube, Instagram, Twitter, Facebook } from "lucide-react";
import Image from "next/image";
import type { Locale } from "@/i18n/config";
import type { WebsiteMenuItem } from "@/types/website";
import { useTranslations } from "next-intl";

type SocialLink = { name: string; href: string };


function toSocialLinks(items?: WebsiteMenuItem[]): SocialLink[] {
  if (!items?.length) return [];
  return items
    .filter((i) => i.isVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((i) => ({ name: i.label, href: i.url }));
}

function TwitterXIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2H21.5l-7.11 8.12L22.75 22h-6.56l-5.14-6.73L5.2 22H1.94l7.6-8.68L1.25 2h6.72l4.64 6.13L18.244 2zm-1.15 18h1.82L6.99 3.9H5.03L17.094 20z" />
    </svg>
  );
}

function iconForSocial(name: string) {
  const n = name.toLowerCase();
  if (n.includes("instagram")) return Instagram;
  if (n.includes("twitter") || n.includes("x")) return TwitterXIcon;
  if (n.includes("youtube") || n.includes("you tube")) return Youtube;
  if (n.includes("facebook")) return Facebook;
  return null;
}

export default function Footer({
  locale,
  menuItems,
  socialMenuItems,
}: {
  locale: Locale;
  menuItems?: WebsiteMenuItem[];
  socialMenuItems?: WebsiteMenuItem[];
}) {
  const socialLinks = toSocialLinks(socialMenuItems);
  const t = useTranslations("footer");
  return (
    <footer className="w-full bg-black text-white px-4 py-12  md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-350 flex-col items-start justify-between gap-12 md:flex-row">
        {/* Left Side */}
        <div className="max-w-sm">
          {/* Logo */}
          <div className="mb-4">
            <Image src="/logo/OperaWhite.avif" alt="Footer Logo" width={90} height={77} />
          </div>
          <p className="text-[15px] text-white mb-8 font-montserrat leading-normal lg:pr-8">
            <span className="block">{t("dubaiOperaByEmaarDescription")}</span>
            <span className="block">{t("dubaiOperaByEmaarDescription2")}</span>
          </p>
          {/* Socials */}
          <div className="flex gap-6 text-gray-400">
            {socialLinks.map((social) => {
              const Icon = iconForSocial(social.name);
              const href = (social.href);
              return (
                <Link
                  key={social.name}
                  href={href}
                  className="text-white transition-colors hover:opacity-80"
                  aria-label={social.name}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noreferrer" : undefined}
                >
                  {Icon ? <Icon size={20} /> : <span className="text-sm">{social.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Side Links */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-8 md:gap-16 sm:pr-8 lg:pr-24 w-full ">
          {menuItems?.map((item) => (
            <div key={item.label} className="flex flex-col gap-4 text-sm text-gray-400">
              {item.children.map((link, index) => (
                <Link
                  key={link.label}
                  href={link.url}
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noreferrer" : undefined}
                  className={`hover:text-white font-normal transition-colors text-[16px] font-montserrat text-white w-fit`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mx-auto mt-12 flex items-center justify-between border-t border-white pt-5 font-montserrat text-base text-white w-full">
        <div className="">
          <Link href={`/${locale}`} className="hover:text-white transition-colors">
            <Image src="/logo/logoEmaar.png" alt="Footer Logo" width={61} height={13} />
          </Link>
        </div>
        <p>© {new Date().getFullYear()} {t("dubaiOperaByEmaar")}</p>
      </div>
    </footer>
  );
}

