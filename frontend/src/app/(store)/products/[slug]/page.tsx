import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { ProductBackButton } from "@/components/catalog/product-back-button";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { Container } from "@/components/layout/container";
import { fetchProductBySlug } from "@/lib/api/products.api";
import { getStoreConfig } from "@/lib/api/store-config.api";
import { ApiError } from "@/lib/api/errors";
import {
  formatCannabinoidLine,
  formatPackPrice,
  hasSellablePack,
} from "@/lib/catalog/format";
import { SITE_NAME } from "@/config/brand";
import {
  BRAND_OG_IMAGE_PATH,
  getBrandOgImageMetadata,
} from "@/lib/seo/site-metadata";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadProduct(slug: string) {
  try {
    return await fetchProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const [product, storeConfig] = await Promise.all([
      fetchProductBySlug(slug),
      getStoreConfig(),
    ]);
    const description =
      product.description?.trim() ||
      `${product.name} - ${formatPackPrice(product, storeConfig.defaultCurrency)} on ${SITE_NAME}`;

    return {
      title: product.name,
      description,
      openGraph: {
        title: product.name,
        description,
        type: "website",
        images: [getBrandOgImageMetadata()],
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description,
        images: [BRAND_OG_IMAGE_PATH],
      },
    };
  } catch {
    return {
      title: `Product | ${SITE_NAME}`,
    };
  }
}

function ChipList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div>
      <h2 className="text-sm font-medium">{label}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={`${label}-${item}`}
            className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-sm text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, storeConfig] = await Promise.all([
    loadProduct(slug),
    getStoreConfig(),
  ]);
  const cannabinoidLine = formatCannabinoidLine(product);
  const images = product.images ?? [];
  const flavors = (product.flavors ?? []).map((f) => f.trim()).filter(Boolean);
  const effects = (product.effects ?? []).map((e) => e.trim()).filter(Boolean);
  const sellable = hasSellablePack(product);
  const packLabel = formatPackPrice(product, storeConfig.defaultCurrency);
  const subtitleParts = [
    product.category?.name,
    product.strainType?.trim() || null,
    product.productType?.trim() || null,
  ].filter(Boolean);

  return (
    <Container as="main" className="min-w-0 py-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Products
        </Link>
        {product.category?.slug ? (
          <>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-2">
        <ProductGallery
          images={images}
          coverImageIndex={product.coverImageIndex}
          productName={product.name}
        />

        <div className="flex min-w-0 flex-col gap-6">
          {subtitleParts.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {subtitleParts.join(" · ")}
            </p>
          ) : null}

          <div className="min-w-0">
            <h1 className="text-pretty break-words">{product.name}</h1>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {packLabel}
            </p>
            {cannabinoidLine ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {cannabinoidLine}
              </p>
            ) : null}
          </div>

          {product.description ? (
            <div>
              <h2 className="text-sm font-medium">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                {product.description}
              </p>
            </div>
          ) : null}

          <ChipList label="Flavors" items={flavors} />
          <ChipList label="Effects" items={effects} />

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {sellable ? (
              <AddToCartButton product={product} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Contact us for pricing on this strain.
              </p>
            )}
            <ProductBackButton />
          </div>
        </div>
      </div>
    </Container>
  );
}
