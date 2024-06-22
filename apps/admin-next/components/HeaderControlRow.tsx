type HeaderControlRowItem = {
    content: React.ReactNode;
    onClick: () => void;
};
export function HeaderControlRow({ items, className, buttonClass }: {
    items: HeaderControlRowItem[];
    className?: string;
    buttonClass?: string;
}) {
  return (
    <div className={`mx-auto flex w-full justify-center p-6 ${className}`}>
      {items.map((item, i) => (
        <button key={i} className={`border-r border-gray-300 last:border-0 px-3 py-1 text-green-700 ${buttonClass}`} onClick={item.onClick}>
          {item.content}
        </button>
      ))}
    </div>
  );
}