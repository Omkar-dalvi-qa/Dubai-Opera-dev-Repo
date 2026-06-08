import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { getBaseUrl } from "@/lib/seo/schema";
import {
  getCanonicalUrl,
  getLanguageAlternates,
  resolveCanonicalUrl,
} from "@/lib/seo/canonical";

export type FallbackMetaKey =
  | "home"
  | "news"
  | "faqs"
  | "contact"
  | "aboutUs"
  | "shop"
  | "myAccount"
  | "accessibility"
  | "directions"
  | "visitTours"
  | "visitDining";

type MetaFallback = {
  title: string;
  description: string;
  mainTitle: string;
  canonicalPath: string; // e.g. "/news" (no locale prefix)
};

export type ApiSEO = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
};

// Fallbacks from `Meta Data.xlsx` (English).
const FALLBACKS_EN: Record<FallbackMetaKey, MetaFallback> = {
  home: {
    title: "Discover Events & Experiences in UAE | Dubai Opera",
    description:
      "Discover an array of cultural events, concerts, and shows at Dubai Opera and experience world-class entertainment at an iconic venue. Book your tickets now.",
    mainTitle: "Dubai Opera",
    canonicalPath: "",
  },
  news: {
    title: "Dubai Opera News & Updates",
    description:
      "Read the latest news, announcements and updates from Dubai Opera. Stay informed about new shows, events and special programs",
    mainTitle: "Dubai Opera News",
    canonicalPath: "/news",
  },
  faqs: {
    title: "Frequently Asked Questions (FAQs) | Dubai Opera",
    description:
      "We provide you with answers to all the frequently asked questions. Explore Dubai Opera's gift vouchers, how to receive them & more. Click to findout more!",
    mainTitle: "Frequently Asked Questions",
    canonicalPath: "/faqs",
  },
  contact: {
    title: "Contact Us | Dubai Opera",
    description:
      "Get in touch with us to learn more about our versatile spaces, venues, events & more. Get in touch through our phone number or email address.",
    mainTitle: "Contact Us",
    canonicalPath: "/contact-us",
  },
  aboutUs: {
    title: "Our Story | House of Cultures | Dubai Opera",
    description:
      "Our Story behind producing & hosting the most engaging performing arts experiences from Dubai & the world. Visit our website to know more.",
    mainTitle: "Dubai Opera Story",
    canonicalPath: "/about-us",
  },
  shop: {
    title: "Shop | Dubai Opera",
    description: "Explore Dubai Opera products and shop online.",
    mainTitle: "Shop",
    canonicalPath: "/shop",
  },
  myAccount: {
    title: "My Account | Dubai Opera",
    description: "Manage your Dubai Opera profile and preferences.",
    mainTitle: "My Account",
    canonicalPath: "/my-account",
  },
  accessibility: {
    title: "Dubai Opera House Accessibility | Dubai Opera",
    description:
      "Make your visit comfortable with our accessibility options. Check out Dubai Opera House accessibility for an easy access. Visit our website to know more. ",
    mainTitle: "Dubai Opera House Accessibility",
    canonicalPath: "/accessibility",
  },
  directions: {
    title: "Directions to Dubai Opera | Dubai Opera",
    description:
      "Find us online. Use these directions to reach Dubai Opera by taxi, car, metro, or bus. Explore the directions and start your journey now!",
    mainTitle: "Directions to Dubai Opera",
    canonicalPath: "/directions",
  },
  visitTours: {
    title: "Dubai Opera Tours – Visit & Explore",
    description: "Discover guided tours and visit experiences at Dubai Opera",
    mainTitle: "Tours at Dubai Opera",
    canonicalPath: "/visit/tours",
  },
  visitDining: {
    title: "Dining at Dubai Opera – Restaurants & Cafes",
    description: "Explore dining options at Dubai Opera before or after your visit",
    mainTitle: "Dining at Dubai Opera",
    canonicalPath: "/visit/dining",
  },
};

const FALLBACKS_AR: Record<FallbackMetaKey, MetaFallback> = {
  home: {
    title: "دار الأوبرا دبي | منبع الفن والثقافة في دبي | اوبرا دبي",
    description:
      "إستمتع بمجموعة متنوعة وحصرية من الفعاليات والعروض والحفلات القادمة في دبي أوبرا. لا تجعل الفرصة تفوتك واحجز تذاكرك الآن للاستمتاع بتجارب ترفيهية وممتعة لا تُنسى.",
    mainTitle: "دبي أوبرا",
    canonicalPath: "",
  },
  news: {
    title: "أخبار وتحديثات دبي أوبرا | دبي أوبرا",
    description:
      "اطّلع على آخر الأخبار والإعلانات والتحديثات من دبي أوبرا. كن على اطلاع بالعروض والفعاليات والبرامج الخاصة.",
    mainTitle: "أخبار دبي أوبرا",
    canonicalPath: "/news",
  },
  faqs: {
    title: "الأسئلة الشائعة | دبي أوبرا",
    description:
      "اعثر على إجابات لأكثر الأسئلة شيوعاً حول دبي أوبرا، التذاكر، الفعاليات، والخدمات.",
    mainTitle: "الأسئلة الشائعة",
    canonicalPath: "/faqs",
  },
  contact: {
    title: "اتصل بنا | دبي أوبرا",
    description:
      "تواصل معنا لمعرفة المزيد عن مساحاتنا وقاعاتنا وفعالياتنا. تواصل عبر الهاتف أو البريد الإلكتروني.",
    mainTitle: "اتصل بنا",
    canonicalPath: "/contact-us",
  },
  aboutUs: {
    title: "قصتنا | دبي أوبرا",
    description:
      "تعرّف على قصة دبي أوبرا ورؤيتها في تقديم واستضافة أرقى تجارب الفنون الأدائية من دبي والعالم.",
    mainTitle: "قصة دبي أوبرا",
    canonicalPath: "/about-us",
  },
  shop: {
    title: "المتجر | دبي أوبرا",
    description: "استكشف منتجات دبي أوبرا وأضفها إلى سلة التسوق.",
    mainTitle: "المتجر",
    canonicalPath: "/shop",
  },
  myAccount: {
    title: "حسابي | دبي أوبرا",
    description: "إدارة ملفك الشخصي وتفضيلاتك في دبي أوبرا.",
    mainTitle: "حسابي",
    canonicalPath: "/my-account",
  },
  accessibility: {
    title: "إمكانية الوصول في دبي أوبرا | دبي أوبرا",
    description:
      "اجعل زيارتك أكثر راحة مع خيارات وإرشادات إمكانية الوصول في دبي أوبرا. تعرّف على الخدمات المتاحة لضمان تجربة سهلة للجميع.",
    mainTitle: "إمكانية الوصول في دبي أوبرا",
    canonicalPath: "/accessibility",
  },
  directions: {
    title: "الاتجاهات إلى دبي أوبرا | دبي أوبرا",
    description:
      "اعرف كيفية الوصول إلى دبي أوبرا بالسيارة أو التاكسي أو المترو أو الحافلة. استعرض الإرشادات وابدأ رحلتك الآن.",
    mainTitle: "الاتجاهات إلى دبي أوبرا",
    canonicalPath: "/directions",
  },
  visitTours: {
    title: "جولات دبي أوبرا – زر واستكشف | دبي أوبرا",
    description:
      "اكتشف الجولات الإرشادية وتجارب الزيارة في دبي أوبرا.",
    mainTitle: "جولات في دبي أوبرا",
    canonicalPath: "/visit/tours",
  },
  visitDining: {
    title: "تجارب الطعام في دبي أوبرا – مطاعم ومقاهٍ | دبي أوبرا",
    description:
      "استكشف خيارات الطعام في دبي أوبرا قبل أو بعد زيارتك.",
    mainTitle: "تجارب الطعام في دبي أوبرا",
    canonicalPath: "/visit/dining",
  },
};

export function getMetadataFallback(locale: Locale, key: FallbackMetaKey): MetaFallback {
  return locale === "ar" ? FALLBACKS_AR[key] : FALLBACKS_EN[key];
}

export async function generateMetadataWithFallback(args: {
  locale: Locale;
  key: FallbackMetaKey;
  apiSeo?: ApiSEO;
}): Promise<Metadata> {
  const { locale, key } = args;
  const baseUrl = await getBaseUrl();

  const fb = getMetadataFallback(locale, key);

  const title = typeof args.apiSeo?.title === "string" && args.apiSeo.title.trim()
    ? args.apiSeo.title.trim()
    : fb.title;
  const description =
    typeof args.apiSeo?.description === "string" && args.apiSeo.description.trim()
      ? args.apiSeo.description.trim()
      : fb.description;

  const fallbackCanonical = await getCanonicalUrl({
    locale,
    path: fb.canonicalPath,
  });
  const canonicalUrl = resolveCanonicalUrl(baseUrl, args.apiSeo?.canonicalUrl, fallbackCanonical);

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: canonicalUrl,
      languages: getLanguageAlternates({ baseUrl, path: fb.canonicalPath }),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
  };
}

