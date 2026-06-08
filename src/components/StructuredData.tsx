import type { ReactElement } from "react";

type Props = {
  schemas: unknown[];
};

export default function StructuredData({ schemas }: Props): ReactElement | null {
  if (!schemas?.length) return null;

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          key={idx}
          type="application/ld+json"
        />
      ))}
    </>
  );
}

