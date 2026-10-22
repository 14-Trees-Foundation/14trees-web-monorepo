// A postcard: the guest's photo on one half, their wish on the other. Used for the checkout
// preview and the post-payment screen. It is a preview of how the wish sits on the event page,
// not the printed gift card.
export default function PostCard({
  photoUrl,
  greeting,
  text,
  from,
}: {
  photoUrl: string | null;
  greeting: string;
  text: string;
  from: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-[#fffaf0] shadow-sm">
      <div className="grid aspect-[3/2] grid-cols-2">
        <div className="relative bg-amber-100/60">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="Your photo"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-[11px] text-amber-700/70">
              Your photo goes here
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between border-l border-dashed border-amber-300 p-3 sm:p-4">
          <div className="min-h-0 overflow-hidden">
            <p className="font-serif text-[11px] font-semibold text-gray-800 sm:text-sm">
              {greeting}
            </p>
            <p className="mt-1 line-clamp-6 whitespace-pre-line font-serif text-[11px] italic leading-snug text-gray-700 sm:text-[13px]">
              {text || "Your wish appears here…"}
            </p>
          </div>
          {from && (
            <p className="mt-1 truncate text-right font-serif text-[11px] text-gray-600 sm:text-xs">
              — {from}
            </p>
          )}
        </div>
      </div>
      <p className="border-t border-amber-200 bg-amber-50/70 px-3 py-1.5 text-center text-[10px] uppercase tracking-wider text-amber-700">
        Preview · shown on the memories page after review
      </p>
    </div>
  );
}
