-- Allow Certificate.pdfUrl to be null when R2 isn't configured (cert is still issued).
ALTER TABLE "Certificate" ALTER COLUMN "pdfUrl" DROP NOT NULL;
