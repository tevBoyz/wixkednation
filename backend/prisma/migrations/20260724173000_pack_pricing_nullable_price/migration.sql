-- Pack pricing: both price and volume may be null for contact-for-price.
ALTER TABLE "products" ALTER COLUMN "price" DROP NOT NULL;
