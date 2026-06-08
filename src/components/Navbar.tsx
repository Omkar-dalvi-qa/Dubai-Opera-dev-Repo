"use client";

import Link from "next/link";
import {
  Search,
  ChevronDown,
  X,
  ShoppingCart,
  Loader2,
  User,
  AlignLeft,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHeroTheme } from "@/store/heroStore";
import type { Locale } from "@/i18n/config";
import { switchLocale } from "@/i18n/navigation";
import { useShopCart } from "@/contexts/shop-flow/ShopCartContext";
import type { WebsiteMenuItem } from "@/types/website";
import { useAuth } from "@/contexts/auth/AuthContext";
import { ExternalEvent, getEventsBySearch } from "@/services/eventServer";
import { imageUrl } from "@/utils/imageUrl";
import { debounce } from "lodash";
import { useTranslations } from "next-intl";
import { formatCardDate } from "@/helpers/programs-booking/formHelpers";

type NavItem = {
  label: string;
  href: string;
  openInNewTab?: boolean;
  children?: NavItem[];
};

function menuItemsToNav(locale: Locale, items: WebsiteMenuItem[]): NavItem[] {
  return items
    .filter((i) => i.isVisible !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((i) => ({
      label: i.label,
      href: i.url,
      openInNewTab: i.openInNewTab,
      children: i.children?.length
        ? menuItemsToNav(locale, i.children)
        : undefined,
    }));
}

export default function Navbar({
  locale,
  menuItems,
}: {
  locale: Locale;
  menuItems?: WebsiteMenuItem[];
}) {
  const [isScrolled, setisScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileDropdowns, setOpenMobileDropdowns] = useState<
    Record<string, boolean>
  >({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const heroTheme = useHeroTheme();
  const [isUserOpen, setIsUserOpen] = useState(false);
  const userRefDesktop = useRef<HTMLDivElement>(null);
  const userRefMobile = useRef<HTMLDivElement>(null);
  const navItems: NavItem[] = menuItemsToNav(locale, menuItems ?? []);
  const isBookingSeatsPage = pathname.includes("/booking/seats");
  const visibleNavItems = isBookingSeatsPage ? [] : navItems;
  const { cartCount } = useShopCart();
  const { user, logout, startSsoLogin, isLoading } = useAuth();
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExternalEvent[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isWhiteTheme = isHome && heroTheme === "white" && !isScrolled;
  const t = useTranslations("common");
  useEffect(() => {
    const handleScroll = () => {
      setisScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMobileDropdown = (key: string) => {
    setOpenMobileDropdowns((prev) => {
      if (prev[key]) {
        return {};
      }
      return { [key]: true };
    });
  };
  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
  };

  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearchQuery(value);
      }, 500),
    [],
  );

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery);
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [searchQuery, debouncedSetSearchQuery]);

  /* ─── Mobile search API call ───────────────────────── */
  useEffect(() => {
    const fetchEvents = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        setSearchLoading(true);
        const response = await getEventsBySearch(debouncedSearchQuery, locale);

        const payload = response?.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        setSearchResults(list);
      } catch (error) {
        console.error("Error fetching events:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    fetchEvents();
  }, [debouncedSearchQuery, locale]);

  const handleLocaleSwitch = (newLocale: Locale) => {
    const newPath = switchLocale(pathname, newLocale);
    router.push(newPath);
    setIsMobileMenuOpen(false);
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchLoading(false);
    setIsLangOpen(false);
  };

  // Close lang dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inDesktop = userRefDesktop.current?.contains(target) ?? false;
      const inMobile = userRefMobile.current?.contains(target) ?? false;
      if (!inDesktop && !inMobile) setIsUserOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserOpen(false);
    await logout({ redirectTo: `/${locale}` });
  };

  const navBgClass = isScrolled ? "bg-black/40 backdrop-blur-lg shadow-lg" : "bg-black";

  const textColorClass =
    isScrolled || !isWhiteTheme ? "text-white" : "text-black";
  const iconColorClass =
    isScrolled || !isWhiteTheme ? "text-white" : "text-black";

  return (
    <>
      <nav
        data-testid="navbar"
        className={`sticky top-0 left-0 w-full z-50 flex items-center justify-between px-4 lg:px-12 h-[82px] transition-all duration-300 scroll-smooth ease-in-out will-change-transform ${navBgClass} ${textColorClass}`}
      >
        {/* {JSON.stringify(menuItems)} */}
        {/* Logo */}
        <Link data-testid="nav-logo" href={`/${locale}`} className="flex items-center gap-2">
          <div className="w-17 h-14.5 flex items-center justify-center">
            <Image
              src={
                isWhiteTheme ? "/logo/mainlogo.webp" : "/logo/OperaWhite.webp"
              }
              alt="Logo"
              width={68}
              height={58}
              loading="eager"
              className="w-full h-full object-contain"
            />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div data-testid="nav-desktop-links" className="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wide h-full">
          {visibleNavItems.map((item, index) => {
            const itemKey = `${index}:${item.label}:${item.href}`;
            const isActive =
              pathname === item.href ||
              (item.href !== `/${locale}` && pathname.startsWith(item.href));

            const underlineColor =
              isWhiteTheme && !isScrolled ? "after:bg-black" : "after:bg-white";

            const linkContainerClasses = `relative flex items-center h-full gap-1 transition-colors ${isActive ? `after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[2px] ${underlineColor}` : "hover:opacity-70"}`;
            const activeTextClasses = `${isActive ? `font-bold font-montserrat` : `font-montserrat font-normal`}`;

            if (item.children) {
              return (
                <div
                  key={itemKey}
                  data-testid={`nav-dropdown-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="relative group h-full flex items-center"
                >
                  <Link
                    href={item.href}
                    data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={linkContainerClasses}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noreferrer" : undefined}
                  >
                    <span className={activeTextClasses}>{item.label}</span>
                    <ChevronDown
                      size={16}
                      className="shrink-0"
                      strokeWidth={isActive ? 2 : 1.5}
                    />
                  </Link>
                  <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}-dropdown-panel`} className="bg-[#1a1a1a] rounded-lg min-w-45 shadow-xl overflow-hidden mt-1">
                      {item.children.map((child, childIndex) => {
                        const childKey = `${itemKey}:child:${childIndex}:${child.label}:${child.href}`;
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={childKey}
                            href={child.href}
                            data-testid={`nav-dropdown-item-${child.label.toLowerCase().replace(/\s+/g, "-")}`}
                            className={`block px-5 py-2.5 transition-colors text-base font-semibold font-montserrat ${isChildActive
                              ? "text-white bg-white/10"
                              : "text-white hover:bg-white/10"
                              }`}
                            target={child.openInNewTab ? "_blank" : undefined}
                            rel={child.openInNewTab ? "noreferrer" : undefined}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <Link
                key={itemKey}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={linkContainerClasses}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noreferrer" : undefined}
              >
                <span className={activeTextClasses}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Actions - Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          <button
            data-testid="nav-search-btn"
            onClick={() => setIsSearchOpen(true)}
            className={`hover:opacity-70 transition-colors ${iconColorClass} cursor-pointer`}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <Link
              data-testid="nav-cart-link"
              href={`/${locale}/shop/cart`}
              className={`relative inline-flex hover:opacity-70 transition-colors ${iconColorClass}`}
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 ? (
                <span className="absolute -right-2.5 -top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-light px-1 font-montserrat text-[11px] font-semibold leading-none text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
            {/* Language Dropdown */}
            {/* <div ref={langRef} className="relative">
              <button
                onClick={() => setIsLangOpen((v) => !v)}
                className={`flex items-center gap-1.5 transition-colors text-sm font-normal font-montserrat px-2 py-1 rounded hover:bg-white/10 ${textColorClass}`}
                aria-haspopup="listbox"
                aria-expanded={isLangOpen}
              >
                <span className="font-semibold tracking-wider">
                  {locale === "en" ? "EN" : "عر"}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl overflow-hidden z-50">
                  {[
                    { code: "en" as Locale, label: "English", short: "EN" },
                    { code: "ar" as Locale, label: "العربية", short: "عر" },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLocaleSwitch(lang.code)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-montserrat transition-colors ${locale === lang.code
                        ? "bg-primary-light text-white font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-xs opacity-60 font-mono">
                        {lang.short}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div> */}
          </div>
          {user && !isLoading ? (
            <div ref={userRefDesktop} className="relative">
              <button
                data-testid="nav-user-menu-btn"
                onClick={() => setIsUserOpen((v) => !v)}
                className={`hover:opacity-70 inline-flex items-center gap-2 transition-colors ${textColorClass}`}
                aria-label="User menu"
              >
                <span className="bg-[#1A1A1A] rounded-full p-1.5">
                  <User className="w-[20px] h-[20px]" />
                </span>
                <span className="font-medium text-[16px] leading-[20px] font-montserrat ">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.email ||
                    "User"}
                </span>
              </button>

              {isUserOpen && (
                <div data-testid="nav-user-dropdown" className="absolute right-0 top-full mt-3 w-44 rounded-lg bg-surface border border-white/10 shadow-xl overflow-hidden z-50">
                  <Link
                    data-testid="nav-profile-link"
                    href={`/${locale}/my-account`}
                    onClick={() => setIsUserOpen(false)}
                    className="block px-4 py-3 text-sm font-montserrat text-white hover:bg-primary"
                  >
                    Profile
                  </Link>

                  <button
                    data-testid="nav-logout-btn"
                    onClick={handleLogout}
                    className="w-full text-left cursor-pointer px-4 py-3 text-sm font-montserrat text-white hover:bg-primary"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              data-testid="nav-signin-btn"
              type="button"
              disabled={isLoading}
              onClick={() =>
                startSsoLogin({ returnTo: `/${locale}`, mode: "login" })
              }
              className="bg-primary min-w-28 h-10 flex items-center justify-center hover:bg-primary-light disabled:hover:bg-primary text-white px-6 py-2 rounded text-base font-medium font-montserrat transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {!isLoading ? (
                t("signIn")
              ) : (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              )}
            </button>
          )}
        </div>

        {/* Hamburger Menu - Mobile */}
        <div className="flex lg:hidden items-center gap-1 sm:gap-2">
          <Link
            data-testid="nav-mobile-cart-link"
            href={`/${locale}/shop/cart`}
            className={`p-2 hover:bg-white/10 rounded-md transition-all relative active:scale-95 ${iconColorClass}`}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <ShoppingCart size={24} />
            {cartCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary-light px-1 font-montserrat text-[10px] font-bold leading-none text-white shadow-sm">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
          {user && !isLoading && (
            <div ref={userRefMobile} className="relative flex items-center">
              <button
                onClick={() => setIsUserOpen((v) => !v)}
                className={`hover:opacity-70 inline-flex items-center gap-2 transition-colors ${textColorClass}`}
                aria-label="User menu"
              >
                <span className="bg-[#1A1A1A] rounded-full p-1.5">
                  <User className="w-[20px] h-[20px]" />
                </span>
              </button>

              {isUserOpen && (
                <div className="absolute right-0 top-full mt-3 w-44 rounded-lg bg-surface border border-white/10 shadow-xl overflow-hidden z-50">
                  <Link
                    href={`/${locale}/my-account`}
                    onClick={() => setIsUserOpen(false)}
                    className="block px-4 py-3 text-sm font-montserrat text-white hover:bg-primary"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left cursor-pointer px-4 py-3 text-sm font-montserrat text-white hover:bg-primary"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            data-testid="nav-mobile-menu-btn"
            className={`p-2 hover:bg-white/10 rounded-md transition-all active:scale-95 ${iconColorClass}`}
            onClick={() =>
              setIsMobileMenuOpen(true)
            }
            aria-label="Open mobile menu"
          >
            <AlignLeft size={24} />
          </button>
        </div>

      </nav>
      {/* Mobile Menu Drawer */}
      <div
        data-testid="nav-mobile-drawer"
        className={`fixed inset-0 z-60 bg-[#1a1a1a] lg:hidden flex flex-col h-screen overflow-y-auto w-screen transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <Link
            href={`/${locale}`}
            onClick={handleCloseMobileMenu}
          >
            <div className="w-17 h-14.5 flex items-center justify-center">
              <Image
                src="/logo/OperaWhite.webp"
                alt="Logo"
                width={68}
                height={58}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
          </Link>
          <button
            data-testid="nav-mobile-close-btn"
            onClick={handleCloseMobileMenu}
            className="p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close menu"
          >
            <X size={28} strokeWidth={1.5} />
          </button>
        </div>

        {/* Mobile Menu Items */}

        <div className="flex-1 px-8 py-8 flex flex-col gap-6">
          <div className="w-full">
            <div
              className="flex items-center gap-2 w-full rounded-lg py-2 px-4 border border-[#FFFFFF1A] bg-[#0000004D] text-white"
            >
              {searchMode ? (
                <ChevronLeft onClick={() => setSearchMode((prev) => !prev)} size={20} className="text-[#FFFFFF80]" />
              ) : (
                <Search size={20} className="text-[#FFFFFF80]" />
              )}
              <input
                data-testid="nav-mobile-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search")}
                onClick={() => setSearchMode(true)}
                className="w-full bg-transparent border-none outline-none"
              />
            </div>
          </div>
          {searchMode ? (
            <div className="flex flex-col gap-4">
              {searchLoading && (
                <p className="text-sm text-gray-400">Searching...</p>
              )}
              {searchResults && !searchLoading && searchResults?.length > 0 ? searchResults?.map((event) => (
                <Link href={`/${locale}/events/${event.category?.slug}/${event.slug}`} key={String(event.id)} onClick={handleCloseMobileMenu} className="flex items-center gap-4">
                  <Image src={imageUrl(String(event.thumbnail_url || event.image || ""))} alt={String(event.name)} width={100} height={100} className="rounded-lg object-cover w-24 h-24" />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-base font-montserrat font-light text-white line-clamp-2">{event.name}</h3>
                    <p className="text-base text-white"><span className="text-xs text-white">From</span> {` ${event.currency?.code || 'AED'} ${event.min_price}`}</p>
                    <p className="text-sm text-white">{formatCardDate(event as ExternalEvent)}</p>
                  </div>
                </Link>
              )) : !searchLoading && searchResults?.length === 0 && <p className="text-sm text-white font-montserrat font-light">No results found</p>}
            </div>
          ) : (
            <>
              {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== `/${locale}` && pathname.startsWith(item.href));

              const itemKey = `${item.label}:${item.href}`;

              return (
                <div key={itemKey} className="w-full">
                  {item.children ? (
                    <div>
                      <div className="flex items-center justify-between text-left font-montserrat w-full">
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`font-medium text-lg transition-all duration-300 ${
                          isActive
                            ? "text-white underline underline-offset-8 decoration-2"
                            : "text-white"
                        }`}
                      >
                        {item.label}

                        </Link>

                        <ChevronDown
                          onClick={() => toggleMobileDropdown(itemKey)}
                          size={20}
                          strokeWidth={1.5}
                          className={`transition-transform duration-300 ease-in-out ${
                            openMobileDropdowns[itemKey] ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </div>

                      {/* Smooth Dropdown */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out ${
                          openMobileDropdowns[itemKey]
                            ? "max-h-96 opacity-100 mt-5"
                            : "max-h-0 opacity-0 mt-0"
                        }`}
                      >
                        <div className="flex flex-col gap-5 pl-4">
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={`font-montserrat text-sm transition-all duration-300 block ${
                                  isChildActive
                                    ? "text-white underline underline-offset-4"
                                    : "text-[#FFFFFFCC] hover:text-white"
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                target={child.openInNewTab ? "_blank" : undefined}
                                rel={child.openInNewTab ? "noreferrer" : undefined}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`block font-montserrat font-medium text-lg transition-colors duration-300 ${
                        isActive
                          ? "text-white underline underline-offset-8 decoration-2"
                          : "text-white hover:text-gray-300"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={item.openInNewTab ? "noreferrer" : undefined}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
            </>
          )}
        </div>

        {/* Mobile Menu Footer (Language, Search, Sign In) */}
        {!searchMode && (
          <div className="px-6 py-6 border-t border-white/5 bg-[#161616] flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleLocaleSwitch("ar")}
                className={`py-3 px-4 rounded-xl font-montserrat text-sm transition-colors ${locale === "ar" ? "bg-[#7B2223] text-white" : "bg-transparent border border-[#333] text-gray-400 hover:text-white hover:border-white"}`}
              >
                {t("arabic")}
              </button>
              <button
                onClick={() => handleLocaleSwitch("en")}
                className={`py-3 px-4 rounded-xl font-montserrat text-sm transition-colors ${locale === "en" ? "bg-[#7B2223] text-white" : "bg-transparent border border-[#333] text-gray-400 hover:text-white hover:border-white"}`}
              >
                English
              </button>
            </div>
            {user && !isLoading ? (
              <button
                data-testid="nav-mobile-logout-btn"
                onClick={handleLogout}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary-light text-white font-montserrat font-semibold transition-colors mt-2 text-center text-lg cursor-pointer"
              >
                {t("logout")}
              </button>
            ) : (
              <button
                data-testid="nav-mobile-signin-btn"
                type="button"
                disabled={isLoading}
                onClick={() =>
                  startSsoLogin({ returnTo: `/${locale}`, mode: "login" })
                }
                className="w-full py-2 rounded-xl bg-primary hover:bg-primary-light text-white font-montserrat font-semibold transition-colors mt-2 text-center text-lg cursor-pointer"
              >
                {t("signIn")}
              </button>
            )}
          </div>
        )}
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        locale={locale}
      />
    </>
  );
}
