import ExternalLink from "components/ExternalLink";

import { TestimonialCollection } from "components/TestimonialComponent";

import contentful from "contentful-fetch";
import type { Testimonial } from "contentful-fetch/models/testimonials";

async function getData() {
  try {
    const testimonialsResponse: any = await contentful("testimonials");
    const testimonials =
      testimonialsResponse.testimonialCollection.items.filter(
        (i) =>
          i.campaign.heading !==
          "Plant 40,000 Trees to celebrate IIT Kanpur Diamond Jubilee"
      ) as Testimonial[];
    return testimonials;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const text = `Village Vetale is located ~65Km North of Pune. Barely 40-50 years ago, scattered hills in the region were covered with native trees and thick vegetation. Due to uncontrolled tree felling, cattle grazing and grass burning, the same hilltops and slopes stand completely devoid of tree cover today. Annual practice of hill burning ensures that seedlings grown naturally during monsoon stand no chance of survival. The saplings which beat the odds are eaten up by cattle which roam freely over barren hilltops.
In the last six years, through a small scale forestation initiative, we have successfully begun transformation of 25 acres of barren land into a thriving jungle. Enthused by our early success, we are now aiming to expand our eco-restoration work in three neighbouring villages. In the long term, we wish to create a grassroots, sustainable and replicable model for reforestation and continue expanding our efforts to other barren regions all over the world.`;

export default async function ReforestationVetale() {
  const testimonials = await getData();
  return (
    <div className="container min-h-screen bg-white px-32 py-48">
      <h1 className="title-text mb-24 text-center">Vetale Reforestation</h1>
      <iframe
        className="aspect-video w-full"
        src="https://www.youtube.com/embed/V-fZmDAyFVs?si=wawq0hCml80cPHM0"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
      <p className="md:my-10">
        <div className="my-2">{text}</div>
        <ExternalLink href="https://drive.google.com/file/d/1Dlsh6UQFMbk8uiiwQ9h52z9dAq_l9NCJ/view?usp=share_link">
          <span>About 14 Trees (presentation)</span>
        </ExternalLink>
        <br />
        <ExternalLink href="https://drive.google.com/file/d/1aArCbhATAkIRoJl-IxbG4I8Ewp5uqqvy/view?usp=sharing">
          <span>How you can help</span>
        </ExternalLink>
      </p>
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
