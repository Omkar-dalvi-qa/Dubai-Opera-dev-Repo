"use client";

import {
  CalendarDays,
  ChevronLeft,
  CreditCard,
  Heart,
  Loader2,
  Settings,
  Bookmark,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SHOP_PRODUCTS } from "@/lib/shop-products";
import { Country as CSCCountry } from "country-state-city";
import { useMemo } from "react";
import { useAuth } from "@/contexts/auth/AuthContext";
import { toast } from "sonner";
import ProfileBookingsTab, { type BookingTabKey } from "@/components/profile/tabs/ProfileBookingsTab";
import ProfileFavoritesTab, { type FavoriteItem, type FavoriteShow, type FavoriteTabKey } from "@/components/profile/tabs/ProfileFavoritesTab";
import ProfilePaymentsTab, { type PaymentErrors } from "@/components/profile/tabs/ProfilePaymentsTab";
import ProfileSettingsTab from "@/components/profile/tabs/ProfileSettingsTab";
import ProfilePreferencesTab from "@/components/profile/tabs/ProfilePreferencesTab";
import { type GiftCardItem } from "@/components/profile/payments/GiftCard";
import { SAVED_PAYMENT_CARDS, type SavedPaymentCard } from "@/components/profile/payments/SavedCard";
import { getCustomerByEmaarId, getUserFavourate, getUserGiftCards, subscribeWebsiteApi, updateCustomer } from "@/services/websiteServer";
import type { ProfileGiftCardItem } from "@/types/website";
import { EmaarPassUserProfile } from "@/types/emaarpass";
import { ExternalEvent, getEventbyIds } from "@/services/eventServer";

type ProfileSection = "bookings" | "favorites" | "payments" | "settings";
type BookingTab = BookingTabKey;
type FavoriteTab = FavoriteTabKey;

interface ProfileDashboardProps {
  locale: string;
}

const navigationItems = [
  { key: "bookings" as const, label: "My Bookings", icon: CalendarDays },
  { key: "favorites" as const, label: "Favorite", icon: Heart },
  // { key: "payments" as const, label: "Payment Methods", icon: CreditCard },
  { key: "settings" as const, label: "Settings", icon: Settings },
  // { key: "preferences" as const, label: "Saved Preferences", icon: Bookmark },
];

const favoriteShows: FavoriteShow[] = [
  {
    id: 1,
    image: "/images/card.webp",
    category: "Classical Music",
    title: "Roberto Bolle And Friends",
    venue: "Studio",
    date: "10 Oct 2025 - 29 Nov 2025",
    price: "100 AED",
    href: "/programs/this-season/1",
    tag: "selling fast",
  },
  {
    id: 2,
    image: "/images/card-1.webp",
    category: "Classical Music",
    title: "Bjorn Again",
    venue: "Main Auditorium",
    date: "10 Oct 2025 - 29 Nov 2025",
    price: "100 AED",
    href: "/programs/this-season/2",
  },
  {
    id: 3,
    image: "/images/card-2.webp",
    category: "Opera",
    title: "La Traviata",
    venue: "Main Auditorium",
    date: "15 Nov 2025 - 19 Nov 2025",
    price: "150 AED",
    href: "/programs/this-season/3",
  },
  {
    id: 4,
    image: "/images/card-5.webp",
    category: "Ballet",
    title: "Swan Lake",
    venue: "Main Auditorium",
    date: "1 Dec 2025 - 5 Dec 2025",
    price: "200 AED",
    href: "/programs/this-season/4",
  },
  {
    id: 5,
    image: "/images/card-4.webp",
    category: "Contemporary Dance",
    title: "Carmen",
    venue: "Main Auditorium",
    date: "10 Dec 2025 - 12 Dec 2025",
    price: "180 AED",
    href: "/programs/this-season/5",
  },
  {
    id: 6,
    image: "/images/card-6.webp",
    category: "Musical",
    title: "The Phantom of the Opera",
    venue: "Main Auditorium",
    date: "5 Jan 2026 - 15 Jan 2026",
    price: "250 AED",
    href: "/programs/past-shows/7",
  },
];

// const favoriteItems: FavoriteItem[] = SHOP_PRODUCTS.slice(1, 4).map((product) => ({
//   id: product.id,
//   name: product.name,
//   price: product.price,
//   brand: product.brand,
//   image: product.image,
//   href: `/shop/${product.slug}`,
// }));

export default function ProfileDashboard({ locale }: ProfileDashboardProps) {
  const { user, isLoading: isAuthLoading, setUser } = useAuth();
  const [activeSection, setActiveSection] = useState<ProfileSection>("bookings");
  const [bookingTab, setBookingTab] = useState<BookingTab>("upcoming");
  const [favoriteTab, setFavoriteTab] = useState<FavoriteTab>("shows");
  const [privacySettings, setPrivacySettings] = useState({
    dataCollection: true,
    marketingCommunications: true,
  });

  const [isAddingCard, setIsAddingCard] = useState(false);
  type SettingsSubView = "main" | "edit-info" | "change-password" | "privacy";
  const [settingsSubView, setSettingsSubView] = useState<SettingsSubView>("edit-info");
  const [isSettingsFetching, setIsSettingsFetching] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [favoriteEvents, setFavoriteEvents] = useState<ExternalEvent[]>([]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSubmitError, setPasswordSubmitError] = useState("");
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const allCountries = useMemo(() => CSCCountry.getAllCountries(), []);
  const countryOptions = useMemo(
    () => allCountries.map((country) => ({ value: country.name, label: country.name })),
    [allCountries]
  );

  const [editForm, setEditForm] = useState({
    title: "",
    firstName: "",
    lastName: "",
    nationality: "",
    dob: null as Date | null,
    gender: "",
    email: "",
    isNewsLetterSubscribed: false,
    mobileNumber: "",
    address: "",
    country: "",
    city: "",
    zipCode: "",
  });

  useEffect(() => {
    if (!user) return;
    const dob =
      typeof user?.dob === "string" && user?.dob?.trim()
        ? new Date(user?.dob)
        : null;
    setEditForm((prev) => ({
      ...prev,
      title: (user?.title ?? "") as string,
      firstName: (user?.firstName ?? "") as string,
      lastName: (user?.lastName ?? "") as string,
      nationality: (user?.nationality ?? "") as string,
      dob: dob && !Number.isNaN(dob.getTime()) ? dob : null,
      gender: (user?.gender ?? "") as string,
      email: (user?.email ?? "") as string,
      mobileNumber: (user?.mobileNumber as string) ?? "",
      isNewsLetterSubscribed: (user?.isNewsLetterSubscribed ?? false) as boolean,
      address: (user?.address ?? "") as string,
      city: (user?.city ?? "") as string,
      country: (user?.country ?? "") as string,
      zipCode: (user?.zipCode ?? "") as string,
    }));
    const fetchFavouriteEvents = async () => {
      if (!user?.emmarId) return;
    
      try {
        setIsLoadingFavorites(true);
    
        const res = await getUserFavourate(String(user.emmarId));
        const eventIds = res?.event_ids ?? [];
    
        if (!eventIds.length) {
          setFavoriteEvents([]);
          return;
        }
    
        const events = await getEventbyIds(eventIds as string[]);
        setFavoriteEvents(events);
      } catch (error) {
        console.error("Failed to fetch favorite events:", error);
        setFavoriteEvents([]);
      } finally {
        setIsLoadingFavorites(false);
      }
    };
    fetchFavouriteEvents();
  }, [user]);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "User";
  const initials = (() => {
    const a = ((user?.firstName || user?.email || "") as string).trim()[0] || "U";
    const b = ((user?.lastName || "") as string)?.trim()[0] || "";
    return `${a}${b}`.toUpperCase();
  })();

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: "52px",
      backgroundColor: "#0000004D",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": {
        borderColor: "rgba(255,255,255,0.3)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "#1E1E1E",
      borderRadius: "10px",
      zIndex: 60,
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 60 }),
    singleValue: (base: any) => ({
      ...base,
      color: "white",
      fontFamily: "Montserrat",
      fontSize: "14px",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "rgba(255,255,255,0.2)",
      fontFamily: "Montserrat",
      fontSize: "14px",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "rgba(255,255,255,0.08)" : "#1E1E1E",
      color: "white",
      fontFamily: "Montserrat",
      fontSize: "14px",
      cursor: "pointer",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "rgba(255,255,255,0.7)",
      padding: "4px 8px",
    }),
  };

  const [paymentCards, setPaymentCards] = useState<SavedPaymentCard[]>(() => [...SAVED_PAYMENT_CARDS]);
  const [giftCards, setGiftCards] = useState<GiftCardItem[]>([]);


  const profileGiftCardData = (card: ProfileGiftCardItem): GiftCardItem => {
    const suffix = card.card_number.slice(-3);
    const expiry = card.expires_at ? new Date(card.expires_at) : null;
    return {
      id: String(card.id),
      codeSuffix: `-${suffix}`,
      maskedTail: "....",
      expiryLabel:
        expiry && !Number.isNaN(expiry.getTime())
          ? expiry.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—",
      balance: card.balance,
      currency: "AED",
    };
  };

  useEffect(() => {
    const mobile = String(user?.mobileNumber ?? "").trim();
    const email = String(user?.email ?? "").trim();
    if (!mobile || !email) return;

    (async () => {
      try {
        const cards = await getUserGiftCards(mobile, email);
        setGiftCards(cards.map(profileGiftCardData));
      } catch (error) {
        console.error("Failed to fetch gift cards:", error);
      }
    })();
  }, [user?.email, user?.mobileNumber]);

  const formatDateYYYYMMDD = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const setDefaultPaymentCard = (id: string) => {
    setPaymentCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const removePaymentCard = (id: string) => {
    setPaymentCards((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) return next;
      if (!next.some((c) => c.isDefault)) {
        return next.map((c, i) => ({ ...c, isDefault: i === 0 }));
      }
      return next;
    });
  };

  const headingBySection: Record<ProfileSection, string> = {
    bookings: "My Bookings",
    favorites: "Favorite",
    payments: "Payment Methods",
    settings: "Settings",
    // preferences: "preferences",
  };

  const handleSettingsEdit = async () => {
    if (!user?.emmarId) return;
    setIsSettingsFetching(true);
    try {
      const res = await getCustomerByEmaarId(String(user?.emmarId ?? ""));
      if ("data" in res && res.data) {
        const c = res.data;
        setEditForm((prev) => ({
          ...prev,
          title: c.title ?? "",
          firstName: c.firstName ?? "",
          lastName: c.lastName ?? "",
          nationality: c.nationality ?? "",
          dob: c.dob ? new Date(c.dob) : null,
          gender: c.gender ?? "",
          email: c.email ?? prev.email,
          mobileNumber: c.mobileNumber ?? prev.mobileNumber,
          address: c.address ?? "",
          country: c.country ?? "",
          city: c.city ?? "",
          zipCode: c.zipCode ?? "",
          isNewsLetterSubscribed: c.isNewsLetterSubscribed ?? false,
        }));
      }
      setSettingsSubView("edit-info");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load profile details");
      setSettingsSubView("edit-info");
    } finally {
      setIsSettingsFetching(false);
    }
  };

  const handleSettingsSave = async () => {
    if (!user?.emmarId) return;
    setIsSettingsSaving(true);
    try {
      if (editForm.isNewsLetterSubscribed) {
        const subscribed = await subscribeWebsiteApi(editForm.email);
        if (!subscribed.ok) {
          toast.error(subscribed.error ?? "Failed to subscribe to newsletter");
        }
      }

      const body = {
        title: editForm.title,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        nationality: editForm.nationality,
        dob: editForm.dob ? formatDateYYYYMMDD(editForm.dob) : "",
        gender: editForm.gender,
        mobileNumber: editForm.mobileNumber,
        isNewsLetterSubscribed: editForm.isNewsLetterSubscribed,
        address: editForm.address,
        country: editForm.country,
        city: editForm.city,
        zipCode: editForm.zipCode,
      };

      const res = await updateCustomer(String(user.emmarId), body);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update profile");
        return;
      }

      if (res?.data?.data) {
        setUser(res?.data?.data as EmaarPassUserProfile);
      }

      toast.success("Profile updated successfully");
      // setSettingsSubView("main");
      setSettingsSubView("edit-info");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setIsSettingsSaving(false);
    }
  };

  // if (isAuthLoading) {
  //   return (
  //     <main className="relative min-h-screen bg-black pt-24 font-montserrat text-white sm:pt-28">
  //       <div className="mx-auto w-full max-w-[1496px] px-5 sm:px-8 lg:px-12">
  //         <div className="rounded-[10px] border border-[#2b2b2b] bg-[#1E1E1E] p-6 text-white/80">
  //           Loading profile…
  //         </div>
  //       </div>
  //     </main>
  //   );
  // }

  if (!user) {
    return (
      <main className="relative min-h-screen bg-black font-montserrat text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <p className="text-[16px] font-medium leading-[24px] text-white">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen  bg-black pt-24 font-montserrat text-white sm:pt-28 lg:min-h-screen">
      <div className="bg-linear-to-b from-black/10 via-[#792327] to-black/20">
        <div className="relative mx-auto flex w-full max-w-[1496px] flex-col gap-8 px-5 sm:px-8 lg:h-full lg:flex-row lg:items-start lg:px-12">
          <aside className="w-full lg:h-full lg:max-w-[338px] lg:flex-[0_0_338px] lg:self-start">
            <section className="min-h-[548px] overflow-hidden rounded-[15px] border border-white/6 bg-surface p-0 shadow-[0_24px_60px_rgba(0,0,0,0.28)] lg:h-full">
              <div className="px-7 pb-7 pt-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#792327] text-[22px] font-bold tracking-[-0.02em] text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="font-montserrat text-[18px] font-semibold leading-[28px] tracking-[0] text-white">
                      {displayName}
                    </p>
                    <p className="mt-2 font-montserrat text-[14px] font-normal leading-[20px] tracking-[0] text-white/52">
                      {user?.email || ""}
                    </p>
                  </div>
                </div>
                <div className="mt-7 h-px w-full bg-[#494949]" />
              </div>

              <nav className="flex flex-col gap-2 px-7 pb-7">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;

                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className={`flex h-[54px] items-center gap-4 rounded-[12px] px-4 text-left transition-colors ${isActive
                        ? "bg-[#792327] text-white"
                        : "text-white/80 hover:bg-white/3 hover:text-white"
                        }`}
                    >
                      <Icon size={20} strokeWidth={1.9} />
                      <span className="font-montserrat text-[16px] font-medium leading-[24px] tracking-[0] text-left">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </section>
          </aside>

          <section
            className="hideScrollbar w-full overflow-y-auto pb-10"
          >
            {activeSection !== "payments" && (activeSection !== "settings" || settingsSubView === "main") && (
              <div className="mb-7 px-1">
                <h1
                  className={
                    activeSection === "bookings" || activeSection === "favorites" || activeSection === "settings" || activeSection === "preferences"
                      ? "font-optima text-[30px] font-normal leading-[45px] tracking-[0] text-white"
                      : "text-[30px] font-semibold tracking-[-0.03em] text-white sm:text-[46px] lg:text-[31px]"
                  }
                >
                  {headingBySection[activeSection]}
                </h1>
              </div>
            )}

            {activeSection === "bookings" && (
              <ProfileBookingsTab
                locale={locale}
                bookingTab={bookingTab}
                setBookingTab={setBookingTab}
              />
            )}

            {activeSection === "favorites" && (
              <ProfileFavoritesTab
                locale={locale}
                favoriteTab={favoriteTab}
                setFavoriteTab={setFavoriteTab}
                favoriteShows={favoriteShows}
                isLoadingFavorites={isLoadingFavorites}
                favoriteEvents={favoriteEvents}
                favoriteItems={[]}
              />
            )}

            {activeSection === "payments" && (
              <ProfilePaymentsTab
                isAddingCard={isAddingCard}
                setIsAddingCard={setIsAddingCard}
                cardNumber={cardNumber}
                setCardNumber={setCardNumber}
                cardholderName={cardholderName}
                setCardholderName={setCardholderName}
                expiryDate={expiryDate}
                setExpiryDate={setExpiryDate}
                cvv={cvv}
                setCvv={setCvv}
                saveCard={saveCard}
                setSaveCard={setSaveCard}
                setAsDefault={setAsDefault}
                setSetAsDefault={setSetAsDefault}
                errors={errors}
                setErrors={setErrors}
                paymentCards={paymentCards}
                setPaymentCards={setPaymentCards}
                giftCards={giftCards}
                setGiftCards={setGiftCards}
              />
            )}

            {activeSection === "settings" && (
              <ProfileSettingsTab
                displayName={displayName}
                userEmail={user?.email || ""}
                userPhone={(user?.mobileNumber as string) || ""}
                settingsSubView={settingsSubView}
                setSettingsSubView={setSettingsSubView}
                onEdit={handleSettingsEdit}
                onSave={handleSettingsSave}
                isFetching={isSettingsFetching}
                isSaving={isSettingsSaving}
                editForm={editForm}
                setEditForm={setEditForm}
                countryOptions={countryOptions}
                selectStyles={selectStyles}
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                showCurrentPassword={showCurrentPassword}
                setShowCurrentPassword={setShowCurrentPassword}
                showNewPassword={showNewPassword}
                setShowNewPassword={setShowNewPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
                passwordSubmitError={passwordSubmitError}
                setPasswordSubmitError={setPasswordSubmitError}
                privacySettings={privacySettings}
                setPrivacySettings={setPrivacySettings}
              />
            )}

            {/* {activeSection === "preferences" && (
              <ProfilePreferencesTab />
            )} */}
          </section>
        </div>
      </div>


    </main>
  );
}