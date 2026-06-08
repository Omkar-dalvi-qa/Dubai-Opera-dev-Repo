"use client";
import NewsCard from "./NewsCard";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { WebsitePostItem } from "@/types/website";
import { WebsitePostsResponse } from "@/services/websiteServer";

export type NewsSectionPost = {
  slug: string;
  title: string;
  subtitle: string;
  cover: string;
  mobileFeaturedImage?: string;
  cardCover?: string;
  category: string;
};

type NewsSectionProps = {
  posts?: WebsitePostItem[];
  homeData?: WebsitePostItem[];
  locale?: string;
  initialHasMore?: boolean;
};

export default function NewsSection({
  posts,
  homeData,
  locale = "en",
  initialHasMore = false,
}: NewsSectionProps) {
  console.log(posts, "posts?>>>>>>>>>.>>>");
  const [newsPosts, setNewsPosts] = useState<WebsitePostItem[]>(posts ?? []);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const res = await fetch(
        `/api/news/posts?locale=${encodeURIComponent(locale)}&page=${nextPage}&limit=12`,
      );
      if (!res.ok) return;
      const json = (await res.json()) as WebsitePostsResponse;
      if (!json?.success || !Array.isArray(json.items)) return;
      setNewsPosts((prev) => {
        const existing = new Set(prev.map((p) => p.slug));
        const fresh = json.items.filter((p: WebsitePostItem) => !existing.has(p.slug));
        return [...prev, ...fresh];
      });
      setCurrentPage(Number(json.page ?? nextPage) || nextPage);
      setHasMore(Boolean(json.hasMore));
    } finally {
      setIsLoadingMore(false);
    }
  };
  console.log(newsPosts, "newsPosts?>>>>>>>>>.>>>");

  if (posts && posts.length > 0) {
    return (
      <section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {newsPosts.map((post) => (
            <NewsCard key={post.slug} {...post} locale={locale} />
          ))}
        </div>
        {hasMore ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="cursor-pointer rounded bg-[#792327] px-10 py-2.5 font-montserrat text-base font-medium text-white transition-colors hover:bg-[#8d2a30] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingMore ? <Loader2 size={24} className="animate-spin" /> : "Load More"}
            </button>
          </div>
        ) : null}
      </section>
    );
  }


  if (homeData && homeData.length > 0) {
    const visibleHomeData = homeData.filter((item: WebsitePostItem) => item.isFeatured).slice(0, 4);
    
    return (
      <section className="max-w-[1400px] mx-auto w-full pb-10 px-4 md:px-8 lg:px-12">
        <div className="">
          {/* Header */}
          <div className="mb-10">
            <SectionHeader
              sectionTitle={'newsAndUpdates'}
              viewAllLink={'/news'}
            />
          </div>

          {/* Fully Responsive Grid Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {visibleHomeData.map((item: WebsitePostItem) => (
              <NewsCard key={item.slug} {...item} locale={locale} />
            ))}
          </div>
        </div>
      </section>
    );
  }
}
