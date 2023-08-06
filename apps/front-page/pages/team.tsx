// import Layout from '../components/Layout';
// import SEO from '../components/SEO';
import ContentHeader from 'components/ContentHeading';
import Layout from 'components/Layout';
// import InfoSections from 'components/InfoSections';
import Image from 'next/image';

const MyComponent = () => {
  // const imgSrc = (img) => {
  //   return img.src;
  // };
  const DESCRIPTION="14 Trees Foundation is a charitable organization dedicated to building sustainable, carbon-footprint-neutral eco-systems through re-forestation"

  return (
    <Layout>
      {/* <SEO title="14 Trees Foundation" description={DESCRITION}/> */}
      <div className="container sm:pxi-0 mx-auto my-10 overflow-x-hidden text-gray-800 dark:text-gray-400">
        <div className="md:mx-32 mx-4 md:pt-16">
          <ContentHeader title="14 Trees Foundation" sub={DESCRIPTION} />
          {/* {info.images && (
            <div>
              {info.images.map((img, index) => (
                <div key={index} className="flex items-center justify-center pb-4 self-center w-full">
                  {imgSrc(img) && (
                    <div className="w-full">
                      <Image src={imgSrc(img)} alt="" layout="responsive" objectFit="contain" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )} */}
        </div>
      </div>

      {/* <div className="flex justify-center md:mt-20 mt-12">
        <span className="w-1/3 pb-4 mb-4 border-b-2 border-gray-300"></span>
      </div> */}

      {/* <div className="container mt-16 md:mt-24 mx-auto overflow-x-hidden text-gray-800 dark:text-gray-400">
        {info && <InfoSections sections={info.sections} />}
      </div> */}
    </Layout>
  );
};

export default MyComponent;
