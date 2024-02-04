import Head from "next/head";
import ContentHeader from "components/ContentHeading";
import Image from "next/image";
import labels from "~/assets/labels.json";
import tree_graphic from "~/assets/images/tree_graphic.jpg";
import MotionDiv from "components/animation/MotionDiv";

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 10, scale: 1.05 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5 },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 1.05, x: 0, y: 20 },
    visible: {
      opacity: 0.1,
      scale: 1,
      x: 50,
      y: 0,
      transition: { delay: 0.1, duration: 0.4 },
    },
  };

  return (
    <>
      <Head>
        <title>{labels.site.title}</title>
        <meta name="description" content={labels.site.description} />
      </Head>
      <div className="relative h-screen w-full">
        {/* Image Background */}
        <MotionDiv
          className="fixed right-0 top-0 -z-10 h-full w-2/3"
          initial="hidden"
          animate="visible"
          variants={imageVariants}
        >
          <Image
            src={tree_graphic}
            alt="Eco-friendly reforestation"
            layout="fill"
            objectFit="contain"
            quality={100}
          />
        </MotionDiv>
        {/* Text Content */}
        <MotionDiv
          className="container z-0 mx-auto my-10 overflow-x-hidden text-gray-800 dark:text-gray-400"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="z-0 mx-4 md:mx-32 md:pt-16">
            <ContentHeader
              title={labels.site.title}
              sub={labels.site.description}
            />
            {/* CTA Section */}
            <div className="text-center">
              {/* Potential CTA buttons or links */}
            </div>
          </div>
        </MotionDiv>
      </div>
    </>
  );
};

export default HomePage;
