"use client";

import labels from "~/assets/labels.json";
import Image from "next/image";
import tree_graphic from "~/assets/images/tree_graphic.jpg";
import MotionDiv from "components/animation/MotionDiv";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import SectionsCarousel from "components/Partials/SectionsCarousel";
import { Button } from "ui/components/button";
import Link from "next/link";
import { Children, useRef } from "react";
import transformation_image from "~/assets/images/Transformation.jpeg";
import pongs_image from "~/assets/images/Ponds.jpeg";
import livelihood_image from "~/assets/images/Livelihood.jpeg";
import barren_green_image from "~/assets/images/BarrenToGreen.jpeg";

export const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  const imageOpacity = useTransform(scrollYProgress, [0, 0.5], [0.1, 0]);
  const imageVariants = {
    hidden: { opacity: 0, scale: 1.05, x: 0, y: 20 },
    visible: {
      opacity: 0.1,
      scale: 1,
      x: 0,
      y: 0,
      transition: { delay: 0.1, duration: 0.4 },
    },
  };

  const Page1 = () => {
    return (
      <div className="relative min-h-[45vh] w-full md:min-h-[85vh]">
        {/* Image Background */}
        <motion.div
          className="absolute bottom-0 right-0 -z-10 w-full max-w-screen-2xl px-20"
          initial="hidden"
          animate="visible"
          style={{ opacity: imageOpacity }}
          variants={imageVariants}
        >
          <Image
            src={tree_graphic}
            alt="Eco-friendly reforestation"
            className="w-full"
            width={800}
            height={400}
            quality={100}
          />
        </motion.div>
        {/* Text Content */}
        <MotionDiv
          className="container z-0 mx-auto my-10 overflow-hidden text-gray-800 dark:text-gray-400"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="md:mx-12 my-10 object-center text-center md:my-40 md:w-4/5 md:text-left">
              <h2 className="leading-12 text-4xl font-bold tracking-tight text-gray-800 shadow-black drop-shadow-2xl md:text-5xl xl:text-6xl 2xl:text-7xl">
                {labels.site.title}
              </h2>
              <h3 className="text-grey-600 mt-6 text-sm font-light md:text-xl xl:text-4xl">
                {labels.site.description}
              </h3>
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
                <Link href="/volunteer" scroll={false}>
                  <Button variant={"secondary"} className="w-full" size="xl" >
                    Volunteer
                  </Button>
                </Link>

                <Link href="/donate">
                  <Button className="bg-green-800 text-white hover:bg-green-900 w-full" size="xl">
                    Donate 
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    );
  };

  const Page2 = () => {
    return (
      <div className="text-gray-700 dark:text-gray-400">
        <div className="container z-0 mx-auto overflow-hidden">
          <div className="mx-auto w-full md:w-2/3">
            <ScrollReveal>
              <h1 className="section-title mx-auto mb-5 md:text-center">
                Our Transformation Journey
              </h1>
              <h2 className="mx-auto mb-2 mt-6 md:mt-12 text-2xl">
                Restorating Green Cover
              </h2>
              <p className="text-xl font-light text-gray-600">
                We&apos;re restoring native green cover on ecologically degraded
                patches of barren hills near Pune.
              </p>
              <Image
                src={transformation_image}
                className="mx-auto my-4 w-full rounded-md shadow-md"
                alt="Transformation"
                width={800}
                height={400}
                quality={100}
              />
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="mx-auto mb-2 mt-16 text-2xl">
                Recharging Groundwater
              </h2>
              <p className="text-xl font-light text-gray-600">
                We are digging ponds to store rain water and trenches to recharge
                ground water.
              </p>
              <Image
                src={pongs_image}
                className="mx-auto my-4 w-full rounded-md shadow-md"
                alt="Transformation"
                width={800}
                height={400}
                quality={100}
              />
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="mx-auto mb-2 mt-16 text-2xl">
                Transforming barren hills into lush green forests
              </h2>
              <p className="text-xl font-light text-gray-600">
                We&apos;re planting native trees on barren hills - where currently
                only grass grows, - which are burnt every year, - where trees do
                not survive naturally, - where topsoil is eroded, and - where
                groundwater has completely depleted
              </p>
              <Image
                src={barren_green_image}
                className="mx-auto my-4 w-full rounded-md shadow-md"
                alt="Transformation"
                width={800}
                height={400}
                quality={100}
              />
            </ScrollReveal>

            <ScrollReveal>
              <h2 className="mx-auto mb-2 mt-16 text-2xl">
                Generating Livelihoods
              </h2>
              <p className="text-xl font-light text-gray-600">
                .. and we are generating livelihood for local tribals
              </p>
              <Image
                src={livelihood_image}
                className="mx-auto my-4 w-full rounded-md shadow-md"
                alt="Transformation"
                width={800}
                height={400}
                quality={100}
              />
            </ScrollReveal>
          </div>
        </div>
      </div>
    );
  }

  const Page3 = () => {
    return (
      <>
        <div className="h-20 bg-gradient-to-t from-gray-100 to-white dark:bg-gray-800"></div>
        <div className="bg-gray-100 text-gray-800 dark:text-gray-400">
          <div className="container z-0 mx-auto min-h-[80vh] w-full overflow-x-hidden bg-gray-100 md:max-w-screen-lg">
            <h1 className="section-title mx-auto mb-5 md:text-center">
              {labels.about.title}
            </h1>
            <SectionsCarousel autoScroll />
          </div>
        </div>
      </>
    );
  };
  return (
    <div className="overflow-hidden">
      <section id="home">
        <Page1 />
      </section>
      <section id="transformation">
          <Page2 />
      </section>
      <section id="about">
        <ScrollRevealEach>
          <Page3 />
        </ScrollRevealEach>
      </section>
    </div>
  );
};

function ScrollReveal({ children }: React.PropsWithChildren<{}>) {
  // wrap each child in ScrollRevealEach
  return (
    <div>
      {Children.map(children, (child) => (
        <ScrollRevealEach>{child}</ScrollRevealEach>
      ))}
    </div>
  );
}

function ScrollRevealEach({ children }: React.PropsWithChildren<{}>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ duration: 0.4, cubicBezier: [0.17, 0.55, 0.55, 1], delay: 0.1}}
      variants={{
        visible: { opacity: 1, scale: 1, y: 0},
        hidden: { opacity: 0, scale: 0.99, y: 20}
      }}
    >
      <div className="mt-4">
        {children}
      </div>
    </motion.div>
  );
}
export { ScrollReveal, ScrollRevealEach };