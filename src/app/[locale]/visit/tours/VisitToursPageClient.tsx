"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import Partners from "@/components/Partners";
import VisitTicketCard from "@/components/VisitTicketCard";
import Gallery from "@/components/event-tabs/Gallery";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ExternalVisitOperaData } from "@/services/eventServer";
import type { PartnerCategory } from "@/types/website";

type VisitToursPageClientProps = {
  visitData: ExternalVisitOperaData;
  partnerCategories: PartnerCategory[];
};

const AUDITORIUM_IMAGES = [
  { id: 1, src: "/images/tours/tourbg.avif", alt: "Dubai Opera Auditorium View" },
  { id: 2, src: "/images/tours/tourbg.avif", alt: "Dubai Opera Interior" },
  { id: 3, src: "/images/tours/tourbg.avif", alt: "Dubai Opera Stage" },
  { id: 4, src: "/images/tours/tourbg.avif", alt: "Dubai Opera Backstage" }
];

const PAGE_CONTENT = {
  heroTitle: "Visit The Opera",
  overview: {
    title: "Dubai Opera Grand Tour",
    subtitle: "A Symphony of Elegance",
    description:
      "Join the Dubai Opera Grand Tour community and explore the Dubai Opera Grand Tour, a captivating odyssey that unravels the hidden tales and details of this iconic venue in the heart of Downtown Dubai. Discover the allure of its architecture and delve into the fascinating stories that make it a cultural gem in the United Arab Emirates. Your exclusive pass awaits to unlock the mysteries and wonders of Dubai Opera's rich heritage and artistic legacy.",
    expectations: [
      {
        title: "Heritage and Design.",
        description:
          "Explore the beauty and history of Dubai Opera during the Dubai Opera Grand Tour. Learn about the unique architecture, sculptures, and exclusive artworks of this remarkable building. Join us for an enriching experience that unveils the stories behind its rich heritage.",
      },
      {
        title: "Backstage Wonders.",
        description:
          "Explore the mysteries of Dubai Opera's backstage areas with the Dubai Opera Grand Tour. Walk through dressing rooms, mirrored rehearsal rooms, trap room secrets, and witness the rarely seen vast storage area. This exclusive experience is part of the Dubai Opera Grand Tour, offering visitors a behind-the-scenes encounter with the orchestra, details of the dressing rooms, and other attractions during concerts.",
      },
    ],
    reasons: [
      {
        title: "Uncover the Base of Design.",
        description:
          "Immerse yourself in exclusive insights into to the heritage and design that define Dubai Opera as a true masterpiece.",
      },
      {
        title: "Explore Behind-the-Scenes.",
        description:
          "Delve into the magic behind the performances as you get a rare glimpse into the normally hidden backstage areas of this iconic venue.",
      },
      {
        title: "Limited Availability, Maximum Experience.",
        description:
          "Take advantage of a unique opportunity with limited slots for the Dubai Opera Grand Tour, ensuring an intimate and personalized experience. Discover the beauty of the building, explore custom spaces, and peek into dressing rooms - an adventure like no other in Downtown Dubai.",
      },
    ],
  },
  termsAndConditions: [
    "Tours depart from the Plaza Box Office. It is advisable to arrive on time.",
    "Customers arriving late may not be accommodated on tour or refunded. Tickets purchased on a specific time/day are only valid for that.",
    "Dubai Opera is a working building, so the content of the tours may vary. Due to events, some areas may occasionally be closed or restricted access.",
    "You are required to purchase a ticket for all children over 2 years old. Infants under the age of 2 years old are free of charge.",
    "Children under the age of 16 are required to be accompanied by an adult. Refunds will only be made on the grounds that the ticket holder was unaware of such age restrictions.",
    "Photography is generally encouraged on tour. There may be occasions when you are asked to refrain from taking photos. Please ensure that you do not take photos of any customers, staff or artists without obtaining consent.",
    "Any discounts as part of your tour ticket are available only on the day of the tour and cannot be used in conjunction with any other offer.",
    "Tours involve walking, standing and stairs. Guests with mobility restrictions or wheelchair users, please get in touch with tours@dubaiopera.com prior to attending a Tour for further assistance.",
    "Dubai Opera does not offer refunds or exchanges because of a change in your circumstances. Dubai Opera, at its sole discretion, may only refund or exchange a ticket if an event is cancelled or rescheduled and you cannot attend the rescheduled event.",
    "No food or drinks purchased outside are permitted inside Dubai Opera.",
    "Guests must always keep their personal belonging with them. Dubai Opera shall not be liable for any lost or stolen property.",
    "Disclaimer: As Dubai Opera is a working venue, each tour provides a unique experience, and content may vary according to what spaces are available on the day.",
  ],
  directions: {
    locationText: "Dubai Opera House",
    parkingText:
      "You can access P3 basement parking entrance on Sheikh Mohammed bin Rashid Boulevard; the parking entrance is located after Dubai Opera hashtag. Dubai Opera Parking is closed on non-performance days.",
    byCarOrTaxi: [
      {
        title: "From Abu Dhabi",
        description:
          "Continue on Sheikh Zayed Road E11. Take Exit 50 toward Burj Khalifa/ Financial Center Road (Lower level). Follow the road and take the first exit on the right onto Sheikh Mohammed bin Rashid Blvd. Go straight and follow the Dubai Opera signage.You will pass Dubai Opera, which will be on the opposite side of the road. Continue to the traffic lights for the second U-turn available at the junction near Vida Downtown Hotel. Take the U-turn, and you will be on the opposite side of the Boulevard. Continue straight for P3 Underground Parking and follow signage to Dubai Opera once inside the parking.",
      },
      {
        title: "From Dubai Creek and Sharjah",
        description:
          "Take Oud Metha Rd-E66. Take the exit to Al Asayel Road right before Al-Wasl Sports Club. Follow the road then take the exit on the right at School Street towards Dubai Fountain Street. Continue on Dubai Fountain Street past the roundabout via the second exit, then turn left to Sheikh Mohammed bin Rashid Blvd. Follow the road then turn right near Reem Al-Bawadi Restaurant, continue straight and Dubai Opera is located to your left.",
      },
    ],
    byPublicTransport: [
      {
        title: "By Metro",
        description:
          "Ride the Dubai Metro Red Line to Burj Khalifa/Dubai Mall Station. From there, it's a short walk to Dubai Opera. You can also take the Metro Link Bridge to The Dubai Mall and follow signs to Dubai Opera.",
      },
      {
        title: "On bus",
        description:
          "Get off at the stop of Dubai Mall Metro Station and take the walkway to Dubai Opera from Sheikh Mohammed Bin Rashid Boulevard.",
      },
    ],
  },
};

export default function VisitToursPageClient({
  visitData,
  partnerCategories,
}: VisitToursPageClientProps) {
  const pathname = usePathname();
  const localeSegment = pathname.split("/").filter(Boolean)[0] || "en";
  const TABS = ["Overview", "Terms & Conditions", "Directions"];
  const [activeTab, setActiveTab] = useState("Overview");
  const [displayTab, setDisplayTab] = useState("Overview");
  const [isTabContentVisible, setIsTabContentVisible] = useState(true);
  const [directionTab, setDirectionTab] = useState<"car" | "public">("car");
  const galleryData = AUDITORIUM_IMAGES.map((img) => ({
    id: String(img.id),
    image_url: img.src,
  }));
  useEffect(() => {
    if (activeTab === displayTab) return;
    setIsTabContentVisible(false);
    const timer = window.setTimeout(() => {
      setDisplayTab(activeTab);
      setIsTabContentVisible(true);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [activeTab, displayTab]);

  return (
    <main className="min-h-screen flex flex-col w-full relative bg-linear-to-b from-[#060102] from-[10%] via-[#792327] via-[80%] to-black">
      <section className="relative w-full h-[40vh] lg:h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden z-0">
        <video
          className="absolute inset-0 w-full h-full object-cover "
          src="/videos/VisitOperaback.mp4"
          autoPlay
          muted
          loop
          playsInline
        />


        <Link href={`/${localeSegment}`} className="absolute top-20 left-4 lg:left-20 z-10 inline-flex items-center gap-1 text-white hover:text-white text-[14px] leading-[31px] font-montserrat transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-white">Back</span>
        </Link>

        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl z-1 font-optima tracking-[0.15em] text-center font-light uppercase mt-12 drop-shadow-lg">
          {PAGE_CONTENT.heroTitle}
        </h1>

        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-black/80 to-transparent pointer-events-none z-1" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-[#000000] via-[#000000]/80 to-transparent pointer-events-none z-1" />
      </section>

      <section className="relative w-full pb-20 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1280px] mx-auto w-full flex flex-col lg:flex-row gap-12 lg:gap-20">
          <div className="w-full lg:w-[65%] flex flex-col pt-8">
            <div className="relative z-0 mb-10 w-full min-w-0">
              <span className="pointer-events-none absolute left-0 right-0 bottom-0 h-px md:bg-white" aria-hidden />
              <nav
                className="relative z-10 flex flex-nowrap gap-x-1 sm:gap-x-2 overflow-x-auto [&::-webkit-scrollbar]:hidden whitespace-nowrap"
                role="tablist"
                aria-label="Visit tours tabs"
              >
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 pt-3 pb-4 font-montserrat text-[16px] leading-[100%] tracking-normal text-center text-white transition-colors ${
                      activeTab === tab ? "font-medium" : "font-normal"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute left-0 right-0 bottom-0 h-[4px] bg-primary-light z-1 transition-all duration-300 ease-out" aria-hidden />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div
              className={`transition-all duration-200 ease-out ${
                isTabContentVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
              }`}
            >
            {displayTab === "Overview" && (
              <div className="text-white font-montserrat space-y-10">
                <div>
                  <h2 className="text-3xl md:text-[40px] leading-tight font-optima mb-4">
                    {PAGE_CONTENT.overview.title}
                  </h2>
                  <h3 className="text-[16px] leading-[100%] md:text-2xl font-semibold mb-6 tracking-wide">
                    {PAGE_CONTENT.overview.subtitle}
                  </h3>
                  <p className="text-[16px] text-white">
                    {PAGE_CONTENT.overview.description}
                  </p>
                </div>

                <div className="space-y-6 text-white">
                  <h3 className="text-[32px] leading-[100%] font-optima">What to Expect:</h3>
                  <div className="space-y-6">
                    {PAGE_CONTENT.overview.expectations.map((item) => (
                      <p key={item.title} className="text-[16px] leading-relaxed text-white">
                        <span className="font-semibold">{item.title}</span> {item.description}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 text-white">
                  <h3 className="text-[32px] leading-[100%] font-optima">Why the Dubai Opera Grand Tour?</h3>
                  <div className="space-y-6">
                    {PAGE_CONTENT.overview.reasons.map((item) => (
                      <p key={item.title} className="text-[16px] leading-relaxed">
                        <span className="font-semibold">{item.title}</span> {item.description}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {displayTab === "Terms & Conditions" && (
              <div className="text-white font-montserrat animate-in fade-in duration-500">
                <h2
                  className="text-3xl md:text-[40px] leading-tight font-serif mb-8"
                  style={{
                    fontFamily: "var(--font-optima), var(--font-playfair), serif",
                  }}
                >
                  Terms & Conditions
                </h2>
                <div className="space-y-6">
                  {PAGE_CONTENT.termsAndConditions.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 text-[16px] text-white font-light"
                    >
                      <span className="text-white mt-0 text-xl leading-none">&middot;</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayTab === "Directions" && (
              <div className="text-white font-montserrat animate-in fade-in duration-500">
                <h2
                  className="text-3xl md:text-[40px] leading-tight font-serif mb-8"
                  style={{
                    fontFamily: "var(--font-optima), var(--font-playfair), serif",
                  }}
                >
                  Get Directions
                </h2>
                <div className="flex items-center gap-3 mb-8">
                  <MapPin className="text-white w-5 h-5" />
                  <span className="text-white text-lg font-medium tracking-wide">
                    {PAGE_CONTENT.directions.locationText}
                  </span>
                </div>
                <p className="text-[16px] text-white font-light mb-10 w-full md:w-[95%]">
                  {PAGE_CONTENT.directions.parkingText}
                </p>
                <div className="flex bg-[#5d2c2f]/40 w-fit rounded-xl overflow-hidden mb-10 border border-white/5">
                  <button
                    onClick={() => setDirectionTab("car")}
                    className={`px-6 py-3.5 text-[15.5px] font-medium transition-colors ${
                      directionTab === "car"
                        ? "bg-[#8b2b32] text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    By Car or Taxi
                  </button>
                  <button
                    onClick={() => setDirectionTab("public")}
                    className={`px-6 py-3.5 text-[15.5px] font-medium transition-colors ${
                      directionTab === "public"
                        ? "bg-[#8b2b32] text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    By Public Transport
                  </button>
                </div>
                <div className="space-y-10 animate-in fade-in duration-300">
                  {(directionTab === "car"
                    ? PAGE_CONTENT.directions.byCarOrTaxi
                    : PAGE_CONTENT.directions.byPublicTransport
                  ).map((item, index) => (
                    <div key={index}>
                      <h3 className="text-2xl font-semibold mb-4 tracking-wide">
                        {item.title}
                      </h3>
                      <p className="text-[16px] text-white font-light w-full md:w-[95%]">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>

          <div className="w-full lg:w-[35%] pt-0 md:pt-8">
            <div className="sticky top-28 z-5">
              <VisitTicketCard
                visitData={visitData}
              />
            </div>
          </div>

          
        </div>

        {displayTab === "Overview" && (
          <div>
            <div className="mt-14">
              <Gallery title="Gallery" data={galleryData} />
            </div>
          </div>
        )}
  
      </section>

      <Partners partnerCategories={partnerCategories} />

    </main>
  );
}

/////,,,,,,,,,,,,,,,,