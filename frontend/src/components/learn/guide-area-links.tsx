import { GuideLink } from "@/components/learn/guide-link";
import { getSeoLocation } from "@/content/seo-locations";

export function GuideAreaLinks({ slugs }: { slugs: readonly string[] }) {
  const areas = slugs
    .map((slug) => getSeoLocation(slug))
    .filter((location): location is NonNullable<typeof location> =>
      Boolean(location),
    );

  return (
    <>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {areas.map((location) => (
          <li key={location.slug} className="text-sm">
            <GuideLink href={`/delivery/${location.slug}`}>
              Weed delivery in {location.name}
            </GuideLink>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <GuideLink href="/delivery">See every delivery area</GuideLink>
      </p>
    </>
  );
}
