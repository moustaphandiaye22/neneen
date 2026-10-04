-- CreateTable
CREATE TABLE "ProductColorOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductColorOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSizeOption" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductSizeOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductColorOption_label_key" ON "ProductColorOption"("label");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSizeOption_label_key" ON "ProductSizeOption"("label");
