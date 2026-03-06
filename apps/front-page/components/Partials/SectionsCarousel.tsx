import React, { useEffect, useState } from "react";
import Image from "next/image";
import labels from "~/assets/labels.json";
import image from "~/assets/images/bg.png";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Autoplay,
} from "ui/components/carousel";
import { Card, CardHeader, CardTitle } from "ui/components/card";

import { GlobeEuropeAfricaIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/20/solid";
import { CardContent } from "ui/components/card";
import Icon, { IconName } from "./Icons";

interface Section {
  title: string;
  content: string;
  icon: IconName;
  image?: {
    src: string;
    caption?: string;
  };
  link?: string;
}

const SectionsCarousel: React.FC<{ autoScroll: boolean }> = ({
  autoScroll,
}) => {
  const sections = labels.about.sections as Section[];

  return (
    <>
      <div className="block">
        <DesktopLayout sections={sections} autoScroll={autoScroll} />
      </div>
      {/* <div className="lg:hidden">
        <MobileLayout sections={sections} />
      </div> */}
    </>
  );
};

// MobileLayout

const MobileLayout: React.FC<{ sections: Section[] }> = ({ sections }) => {
  return (
    <Carousel
        className="mt-20 sm:mx-6"
        plugins={[
          Autoplay({
            delay: 10000,
          }),
        ]}
      >
        <CarouselContent>
          {sections.map((section, index) => (
            <CarouselItem key={section.title}>
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-6">
                  <p>{section.content}</p>
                  <Image
                    src={section.image?.src ?? image}
                    alt={section.image?.caption ?? section.title}
                    className="rounded-md"
                    objectFit="cover"
                    width={300}
                    height={200}
                  />
                  {section.image?.caption && (
                    <p className="text-sm text-gray-500">
                      {section.image.caption}
                    </p>
                  )}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="hidden sm:block">
          <CarouselPrevious />
          <CarouselNext />
        </div>
      </Carousel>
  );
};

const DesktopLayout: React.FC<{ sections: Section[]; autoScroll: boolean }> = ({
  sections,
  autoScroll,
}) => {
  const [i_selectedSection, setSelectedSection] = useState<number | null>(
    autoScroll ? 0 : null
  );

  const [activeSection, setActiveSection] = useState<Section>(
    i_selectedSection ? sections[i_selectedSection] : sections[0]
  );

  useEffect(() => {
    if (autoScroll) {
      const interval = setInterval(() => {
        setSelectedSection(((i_selectedSection ?? 0) + 1) % sections.length);
      }, 13000);
      return () => clearInterval(interval);
    }
  }, [i_selectedSection, autoScroll, sections.length]);

  useEffect(() => {
    setActiveSection(sections[i_selectedSection ?? 0]);
  }, [i_selectedSection, sections]);

  const toggleSection = (index: number) => {
    setSelectedSection(i_selectedSection === index ? null : index);
  };

  return (
    <section className="flex h-full flex-col">
      <div className="flex w-full md:p-4 space-x-1 md:space-x-4">
        {sections.map((section, index) => (
          <motion.div
            className="flex-grow"
            key={section.title}
            layout
            initial={{ borderRadius: 10 }}
          >
            <motion.div
              key={section.title}
              initial={false}
              animate={{
                backgroundColor:
                  index === i_selectedSection ? "#d2d8d0" : "#edeeed",
              }}
              className="h-full cursor-pointer rounded-sm p-2"
              onClick={() => toggleSection(index)}
              transition={{ duration: 0.5 }}
            >
              <div className="flex md:block">
                <Icon
                  className="mx-auto h-4 w-4 my-2 md:my-8 md:h-12 md:w-12"
                  iconName={section.icon}
                />
                <h2 className="my-2 hidden text-center text-sm font-light md:block md:text-md xl:text-xl">
                  {section.title}
                </h2>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="overflow-hidden my-2 md:p-5">
        <div className="">
          <h3 className="page-text text-xl md:text-2xl font-bold">
            {activeSection.title}
          </h3>
          <p className="text-sm md:text-xl">{activeSection.content}</p>
          {activeSection.link ? (
            <Link
              href={activeSection?.link || "#"}
              className="inline-flex border-b border-gray-500 text-sm text-gray-500"
            >
              <span className="">Learn More</span>
              <ArrowUpRightIcon className="mb-0.5 h-5 w-5" />
            </Link>
          ) : (
            <br />
          )}
        </div>
        <div className="mx-auto aspect-[3/2] w-full">
          <div className="relative h-full w-full">
            <Image
              src={activeSection?.image?.src ?? image}
              alt={activeSection?.image?.caption ?? activeSection.title}
              layout="fill"
              objectFit="cover"
              className="rounded-md shadow-lg"
            />
          </div>
        </div>
        {activeSection?.image?.caption && (
          <p className="my-2 text-center text-sm text-gray-500">
            {activeSection?.image?.caption}
          </p>
        )}
      </div>
    </section>
  );
};

export default SectionsCarousel;
