import type { AboutVenuesSlide } from "@/components/about/AboutVenuesSection";

export function getAboutVenuesSlides(
  t: (key: string) => string,
): AboutVenuesSlide[] {
  return [
    {
      imageSrc: "/about/Auditorium.avif",
      imageAlt: t("venues.slides.auditorium.imageAlt"),
      title: t("venues.slides.auditorium.title"),
      description: t("venues.slides.auditorium.description"),
    },
    {
      imageSrc: "/images/banners/studiobanner2.avif",
      imageAlt: t("venues.slides.studio.imageAlt"),
      title: t("venues.slides.studio.title"),
      description: t("venues.slides.studio.description"),
    },
    {
      imageSrc: "https://www.dubaiopera.com/media/PROMENADE_1280x720_11.png",
      imageAlt: t("venues.slides.promenade.imageAlt"),
      title: t("venues.slides.promenade.title"),
      description: t("venues.slides.promenade.description"),
    },
    {
      imageSrc: "https://www.dubaiopera.com/media/GARDEN_1280x720_09.png",
      imageAlt: t("venues.slides.garden.imageAlt"),
      title: t("venues.slides.garden.title"),
      description: t("venues.slides.garden.description"),
    },
    {
      imageSrc: "https://www.dubaiopera.com/media/Venue_1280x720_06.png",
      imageAlt: t("venues.slides.grandCircleFoyer.imageAlt"),
      title: t("venues.slides.grandCircleFoyer.title"),
      description: t("venues.slides.grandCircleFoyer.description"),
    },
  ];
}
