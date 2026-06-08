import Image from "next/image";
import type { CSSProperties } from "react";

type ParagraphItem = {
  text: string;
  className: string;
  style?: CSSProperties;
};

type HeadingTag = "h2" | "h3" | "h4";

type AboutArchitectureProps = {
  sectionClassName?: string;
  textContainerClassName?: string;
  imageContainerClassName?: string;
  imagePosition?: "left" | "right";
  heading: string;
  headingTag?: HeadingTag;
  headingClassName: string;
  headingStyle?: CSSProperties;
  subheading?: string;
  subheadingTag?: HeadingTag;
  subheadingClassName?: string;
  subheadingStyle?: CSSProperties;
  subheadingAfterParagraphs?: number;
  paragraphs: ParagraphItem[];
  imageSrc: string;
  imageAlt: string;
};

export default function AboutArchitecture({
  sectionClassName = "mx-auto mt-12 grid w-full max-w-[1400px] gap-8 md:grid-cols-[1fr_1.35fr] md:items-center md:gap-12",
  textContainerClassName = "max-w-107.5",
  imageContainerClassName = "h-62.5 sm:h-75 md:h-83.75 overflow-hidden rounded-2xl border border-white/15",
  imagePosition = "right",
  heading,
  headingTag = "h2",
  headingClassName,
  headingStyle,
  subheading,
  subheadingTag = "h3",
  subheadingClassName,
  subheadingStyle,
  subheadingAfterParagraphs,
  paragraphs,
  imageSrc,
  imageAlt,
}: AboutArchitectureProps) {
  const Heading = headingTag;
  const Subheading = subheadingTag;
  const hasSubheading = Boolean(subheading && subheadingClassName);
  const subheadingInsertIndex = hasSubheading ? subheadingAfterParagraphs ?? 0 : -1;
  const paragraphsBeforeSubheading =
    subheadingInsertIndex > 0 ? paragraphs.slice(0, subheadingInsertIndex) : [];
  const paragraphsAfterSubheading =
    subheadingInsertIndex > 0 ? paragraphs.slice(subheadingInsertIndex) : paragraphs;

  const renderParagraphs = (items: ParagraphItem[], keyPrefix: string) =>
    items.map((paragraph, index) => (
      <p key={`${keyPrefix}-${index}`} className={paragraph.className} style={paragraph.style}>
        {paragraph.text}
      </p>
    ));

  const textBlock = (
    <div className={textContainerClassName}>
      <Heading className={headingClassName} style={headingStyle}>
        {heading}
      </Heading>
      {renderParagraphs(paragraphsBeforeSubheading, "pre")}
      {hasSubheading ? (
        <Subheading className={subheadingClassName} style={subheadingStyle}>
          {subheading}
        </Subheading>
      ) : null}
      {renderParagraphs(hasSubheading ? paragraphsAfterSubheading : paragraphs, "post")}
    </div>
  );

  const imageBlock = (
    <div className={imageContainerClassName}>
      <Image src={imageSrc} alt={imageAlt} width={1200} height={700} className="h-full w-full object-cover" />
    </div>
  );

  return (
    <section className={sectionClassName}>
      {imagePosition === "left" ? (
        <>
          {imageBlock}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageBlock}
        </>
      )}
    </section>
  );
}
