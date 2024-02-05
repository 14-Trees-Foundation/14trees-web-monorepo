import React from "react";
import Person from "./Person";

function Testimonial({ title, person, content, pictures }) {
  const [picturesToDisplay, setPicturesToDisplay] = React.useState(
    pictures || []
  );

  const hasImgs = Boolean(picturesToDisplay.length > 0);
  const truncatedSmall =
    content.length > 400 ? content.slice(0, 400) + "..." : content;
  const truncatedLarge =
    content.length > 1200 ? content.slice(0, 1200) + "..." : content;

  const imgSrc = (img) => {
    // Your logic to generate image source here
  };

  const imgSrcInd = (ind) => {
    if (ind < picturesToDisplay.length) {
      return imgSrc(picturesToDisplay[ind]);
    }
    return null;
  };

  const openFullTestimonial = () => {
    // Your logic to open full testimonial
  };

  return (
    <section className="body-font text-gray-700">
      <div className="mx-4 py-16 md:py-24">
        <div className="grid grid-cols-8">
          {hasImgs && (
            <div className="col-span-8 flex md:col-span-4 md:justify-end">
              {/* Your images display logic here */}
            </div>
          )}
          <div
            className={`col-span-8 ${
              hasImgs ? "w-full md:col-span-4" : "md:col-span-7 md:col-start-2"
            }`}
          >
            <div className="flex h-full w-full flex-col justify-center pb-4 text-left md:w-3/4 md:pl-12">
              <p
                className="text-md leading-relaxed dark:text-gray-400 md:hidden"
                dangerouslySetInnerHTML={{ __html: truncatedSmall }}
              />
              <p
                className="text-md hidden leading-relaxed dark:text-gray-400 md:contents"
                dangerouslySetInnerHTML={{ __html: truncatedLarge }}
              />
              <div className="mt-4 flex justify-center">
                {content.length > 400 && (
                  <button
                    onClick={openFullTestimonial}
                    className="mb-1 mr-1 rounded border-2
                    border-gray-600 px-6 py-1 text-xs text-gray-700 shadow 
                    outline-none hover:shadow-md focus:outline-none active:bg-gray-600 dark:text-gray-300"
                  >
                    Read
                  </button>
                )}
              </div>
              <div className="flex justify-center">
                <span className="mb-6 mt-8 inline-block h-1 w-10 rounded bg-green-500 text-center"></span>
              </div>
              <Person
                image={person.image}
                name={person.name}
                linkedIn={person.linkedIn}
                title={person.title}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Testimonial;
