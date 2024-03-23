import React, { use, useEffect, useState } from "react";
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

interface Section {
  title: string;
  content: string;
  imageUrl?: string;
  link?: string;
}

const SectionsCarousel: React.FC<{ autoScroll: boolean }> = ({
  autoScroll,
}) => {
  const [sections] = useState<Section[]>(labels.about.sections);

  return (
    <>
      <div className="hidden lg:block">
        <DesktopLayout sections={sections} autoScroll={autoScroll} />
      </div>
      <div className="lg:hidden">
        <MobileLayout sections={sections} />
      </div>
    </>
  );
};

// MobileLayout

const MobileLayout: React.FC<{ sections: Section[] }> = ({ sections }) => {
  return (
    <>
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
            <CarouselItem key={index}>
              <Card className="">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-6">
                  <p>{section.content}</p>
                  <Image
                    src={section.imageUrl || image}
                    alt={section.title}
                    className="rounded-md"
                    objectFit="cover"
                    width={300}
                    height={200}
                  />
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
    </>
  );
};

const DesktopLayout: React.FC<{ sections: Section[]; autoScroll: boolean }> = ({
  sections,
  autoScroll,
}) => {
  const [selectedSection, setSelectedSection] = useState<number | null>(
    autoScroll ? 0 : null
  );

  useEffect(() => {
    if (autoScroll) {
      const interval = setInterval(() => {
        setSelectedSection(((selectedSection || 0) + 1) % sections.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [selectedSection, autoScroll, sections.length]);

  const toggleSection = (index: number) => {
    setSelectedSection(selectedSection === index ? null : index);
  };

  return (
    <div className="flex h-full min-h-screen">
      <div className="flex w-1/2 flex-wrap justify-center p-4">
        <div className="w-full">
          <Image
            src={sections[selectedSection || 0]?.imageUrl || image}
            alt={sections[selectedSection || 0].title}
            width={600}
            height={400}
            className="w-full rounded-md"
            layout="contain"
          />
        </div>
      </div>

      <div className="w-1/2 space-y-4 p-4">
        {sections.map((section, index) => (
          <motion.div key={section.title} layout initial={{ borderRadius: 10 }}>
            <motion.div
              key={index}
              initial={false}
              animate={{
                backgroundColor:
                  index === selectedSection ? "#d2d8d0" : "#edeeed",
              }}
              className="cursor-pointer rounded-sm p-4"
              onClick={() => toggleSection(index)}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex">
                <GlobeEuropeAfricaIcon className="my-auto mr-3 h-6 text-gray-600" />
                <h2 className="my-2 text-2xl font-light">{section.title}</h2>
              </div>
              <motion.div
                key="content"
                initial="collapsed"
                animate={selectedSection === index ? "open" : "collapsed"}
                variants={{
                  open: { opacity: 1, height: "auto" },
                  collapsed: { opacity: 0, height: 0 },
                }}
                transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="pl-9 pr-2">
                  <p>{section.content}</p>
                  {/* {section.link && (
                    <Link
                      href={section.link}
                      className="inline-flex border-b border-gray-500 text-sm text-gray-500"
                    >
                      <span className="">Learn More</span>
                      <ArrowUpRightIcon className="mb-0.5 h-5 w-5" />
                    </Link>
                  )} */}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SectionsCarousel;
