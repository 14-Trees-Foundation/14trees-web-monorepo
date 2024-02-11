"use client";

import Head from "next/head";
import Image from "next/image";
import labels from "~/assets/labels.json";
import tree_graphic from "~/assets/images/tree_graphic.jpg";
import MotionDiv from "components/animation/MotionDiv";
import { motion, useScroll, useTransform } from "framer-motion";
import SectionsCarousel from "components/Partials/SectionsCarousel";
import { Button } from "ui/components/button";
import Link from "next/link";

const HomePage = () => {
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
      <div className="relative min-h-[80vh] w-full md:min-h-[90vh]">
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
          className="container z-0 mx-auto my-10 overflow-x-hidden text-gray-800 dark:text-gray-400"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 pt-16 md:mx-12">
            <div className="mx-12 my-10 object-center text-center md:my-40 md:w-4/5 md:text-left">
              <h2 className="leading-12 text-4xl font-bold tracking-tight text-gray-800 shadow-black drop-shadow-2xl md:text-6xl xl:text-8xl 2xl:text-9xl">
                {labels.site.title}
              </h2>
              <h3 className="text-grey-600 mt-6 text-sm font-light md:text-xl xl:text-4xl">
                {labels.site.description}
              </h3>
              <div className="mt-6 flex flex-col justify-center md:justify-start gap-4 sm:flex-row">
                <Link href="#about">
                  <Button className="bg-gray-200 text-black" size="xl">
                    Learn More
                  </Button>
                </Link>
                <Link href="/contribute">
                <Button className="bg-green-800 text-white" size="xl">
                  Contribute
                </Button>
                </Link>
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    );
  };

  const page2Opacity = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const Page2 = () => {
    return (
      <motion.div style={{ opacity: page2Opacity }} className="w-full ">
        <div className="h-40 bg-gradient-to-t from-gray-100 to-white dark:bg-gray-800"></div>
        <div className="bg-gray-100 text-gray-800 dark:text-gray-400">
          <div className="container z-0 mx-auto min-h-screen overflow-x-hidden bg-gray-100">
            <h1 className="section-title mx-auto w-2/3 text-center">
              {labels.about.title}
            </h1>
            <SectionsCarousel autoScroll />
            {/* <h1 className="text-center text-4xl font-bold">Page 2</h1> */}
            {/* <p className="text-center">This is the second page</p> */}
            {/* print scrollYprogress from framer motion */}
            {/* <motion.div>{scrollYProgress}</motion.div> */}
          </div>
        </div>
      </motion.div>
    );
  };
  return (
    <>
      <Head>
        <title>{labels.site.title}</title>
        <meta name="description" content={labels.site.description} />
      </Head>
      <section id="home">
        <Page1 />
      </section>
      <section id="about">
        <Page2 />
      </section>
    </>
  );
};

export default HomePage;
