-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "reference" DROP DEFAULT,
ALTER COLUMN "ticketSecret" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "reference" DROP DEFAULT;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'neneen',
    "slogan" TEXT NOT NULL DEFAULT 'Les rencontres changent tout.',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT 'Dakar, Sénégal',
    "instagramUrl" TEXT NOT NULL DEFAULT '',
    "facebookUrl" TEXT NOT NULL DEFAULT '',
    "paymentsLive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
