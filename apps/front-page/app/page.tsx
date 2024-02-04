import Head from "next/head";
import ContentHeader from "components/ContentHeading";
import Image from "next/image";
import labels from "~/assets/labels.json";
import tree_graphic from "~/assets/images/tree_graphic.jpg";
import MotionDiv from "components/animation/MotionDiv";

const HomePage = () => {
  const containerVariants = {
    hidden: { opacity: 0.8, y: 100, scale: 1.5 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: 0.5, duration: 0.5 },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 0.1,
      scale: 1,
      transition: { delay: 0.5, duration: 0.5 },
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
          className="absolute left-0 top-0 -z-10 h-full w-full"
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
          className="container mx-auto my-10 overflow-x-hidden text-gray-800 dark:text-gray-400"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="relative z-10 mx-4 md:mx-32 md:pt-16">
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
