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
      <div className="group flex flex-col rounded-xl border border-gray-200 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white">
        <div className="relative w-full overflow-hidden" style={{ height: 280 }}>
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className="px-4 py-3 bg-gray-800">
          <p className="text-sm font-semibold text-white text-center leading-snug">
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
}
