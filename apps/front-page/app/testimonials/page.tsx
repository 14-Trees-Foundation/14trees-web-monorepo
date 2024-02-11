import { Client } from "@notionhq/client";
import Testimonial from "components/TestimonialComponent";
import Head from "next/head";

export default function Testimonials() {
  const testimonials: any[] = []
  return (
    <div className="full-page-generic container">
      <Head>
        <title>Testimonials</title>
      </Head>
      <h1 className="title-text text-center"> Testimonials </h1>
      <div className="mx-4 md:pt-16">
        {testimonials.map((tm, index) => (
          <div key={index}>
            {/* <Testimonial {...tm} /> */}
            <h2 className="text-3xl my-2">{tm.author}</h2>
            {tm.content.map((t,i) => <div className="mt-2 " key={i}>{t}</div>)}
            <div className="flex justify-center">
              <span className="mb-4 w-1/3 border-b-2 border-gray-300 pb-4"></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}