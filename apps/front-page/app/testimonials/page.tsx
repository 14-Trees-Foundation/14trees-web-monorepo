import { TestimonialCollection } from "components/TestimonialComponent";
import Head from "next/head";
import contentful from "contentful-fetch";
import type { Testimonial } from "contentful-fetch/models/testimonials";

async function getData() {
  try {
    const testimonialsResponse: any = await contentful("testimonials");
    const testimonials = testimonialsResponse.testimonialCollection
      .items as Testimonial[];
    return testimonials;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function Testimonials() {
  const testimonials = await getData();
  if (!testimonials) {
    return <div className="p-40">Loading...</div>;
  }
  return (
    <div className="full-page-generic container">
      <Head>
        <title>Testimonials</title>
      </Head>
      <h1 className="title-text text-center"> Testimonials </h1>
      <div className="mx-4 md:pt-16">
        <TestimonialCollection testimonials={testimonials} />
      </div>
    </div>
  );
}