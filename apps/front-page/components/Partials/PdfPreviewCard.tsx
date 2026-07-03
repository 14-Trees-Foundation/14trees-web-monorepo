import Image from "next/image";
import Link from "next/link";

export function PdfPreviewCard({
  title,
  href,
  thumbnail,
}: {
  title: string;
  href: string;
  thumbnail: string;
}) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer">
      <div className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg">
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 400 }}
        >
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="bg-gray-800 px-4 py-3">
          <p className="text-center text-sm font-semibold leading-snug text-white">
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}
