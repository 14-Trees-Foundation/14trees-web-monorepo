import ExternalLink from "components/ExternalLink";
import SlideShow from "components/Partials/SlideShow";
import { TestimonialCollection } from "components/TestimonialComponent";

import contentful from "contentful-fetch";
import { IitkSlide } from "contentful-fetch/models/iitk-slides";
import type { Testimonial } from "contentful-fetch/models/testimonials";

async function getData() {
  try {
    const testimonialsResponse: any = await contentful("testimonials");
    const testimonials =
      testimonialsResponse.testimonialCollection.items.filter(
        (i) =>
          i.campaign.heading ===
          "Plant 40,000 Trees to celebrate IIT Kanpur Diamond Jubilee"
      ) as Testimonial[];

    const slidesResponse = await contentful("iitk-slides");
    const slides = slidesResponse.campaign.presentations.items[0].slides
      .items as IitkSlide[];
    return { testimonials, slides };
  } catch (error) {
    console.error(error);
    return {
      testimonials: null,
      slides: null,
    };
  }
}

export default async function IITKDJC() {
  const { testimonials, slides } = await getData();
  return (
    <div className="container min-h-screen bg-white py-48 sm:px-32">
      <h1 className="title-text mb-24 text-center">Vetale Reforestation</h1>
      <iframe
        className="aspect-video w-full"
        src="https://www.youtube.com/embed/YCVP3bon5Zs?si=HWoSIMcSCPn4CUy6"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
      <p className="md:my-10">
        <ExternalLink href="https://drive.google.com/file/d/1x4vfd9Sqj4IBek-B_vWT3DRaw3r44NZG/view">
          <span>Project 40,000 Trees For IITK-DJC (presentation)</span>
        </ExternalLink>
        <br />
        <ExternalLink href="https://drive.google.com/file/d/1lise-wVTNb9lSROpPw6BSR4VOC3YWWuo/view">
          <span>How you can participate (presentation)</span>
        </ExternalLink>
        <br />
        <ExternalLink href="https://sites.google.com/view/project-40000-trees-tracker">
          <span>Campaign Tracker</span>
        </ExternalLink>
      </p>
      <div className="flex justify-center">
        <span className="my-20 mt-8 inline-block h-0.5 w-40 rounded bg-teal-800 text-center"></span>
      </div>
      {slides && slides.length ? (
        <div className="mb-20">
          <SlideShow
            slides={slides.map((s, i) => ({ title: i, url: s.url }))}
          />
        </div>
      ) : (
        <></>
      )}

      <div className="flex justify-center">
        <span className="my-20 mt-8 inline-block h-0.5 w-40 rounded bg-teal-800 text-center"></span>
      </div>

      {!testimonials || !testimonials.length ? (
        <div className="p-40">Loading...</div>
      ) : (
        <TestimonialCollection testimonials={testimonials} />
      )}
    </div>
  );
}