import sustainability from "~/assets/icons/Sustainability.png";
import reforestation from "~/assets/icons/Reforestation.png";
import community from "~/assets/icons/Community.png";
import technology from "~/assets/icons/Technology.png";
import transparency from "~/assets/icons/Transparency.png";
import inspiration from "~/assets/icons/Inspiration.png";
import Image from "next/image";

const icons = {
  // sustainability: {
  //   src: sustainability,
  //   alt: "Sustainability",
  //   attribution: 
  //           <a href="https://www.flaticon.com/free-icons/sustainability" title="sustainability icons">Sustainability by BomSymbols (Flaticon)</a>
  // },
  community: {
    src: community,
    alt: "Community",
    attribution: <a href="https://www.flaticon.com/free-icons/population" title="population icons">Population by Freepik - Flaticon</a>
  },
  technology: {
    src: technology,
    alt: "Technology",
    attribution: 
            <a href="https://www.flaticon.com/free-icons/innovation" title="innovation icons">Innovation by Parzival’ 1997 (Flaticon)</a>
  },
  reforestation: {
    src: reforestation,
    alt: "Reforestation",
    attribution: <a href="https://www.flaticon.com/free-icons/plantation" title="Plantation icons">Plantation by Creative Stall Premium (Flaticon)</a>
  },
  transparency: {
    src: transparency,
    alt: "Transparency",
    attribution: <a href="https://www.flaticon.com/free-icons/transparency" title="transparency icons">Transparency icons created by Freepik (Flaticon)</a>
  },
  inspiration: {
    src: inspiration,
    alt: "Inspiration",
    attribution: <a href="https://www.flaticon.com/free-icons/kid-and-baby" title="kid and baby icons">Kid and baby icons created by Freepik - Flaticon</a>
  },
};

export type IconName = keyof typeof icons;

export default function Icon({ iconName, className }: { iconName: IconName; className?: string }) {
  if (!icons[iconName]) {
    throw new Error(`Icon ${iconName} not found`);
  }
  return (
    <Image
      src={icons[iconName].src}
      alt={iconName}
      className={className || ""}
      height={64}
      width={64}
    />
  );
}

export function IconsAttribution({ iconName }: { iconName?: IconName }) {
  return iconName ? (
    <div className="text-xs opacity-70">
      {icons[iconName].attribution}
    </div>
  ): <div className="text-xs opacity-70">
    {Object.values(icons).map(icon => (
      <div key={icon.alt} className="">
        {icon.attribution}
      </div>
    ))}
  </div>
}
