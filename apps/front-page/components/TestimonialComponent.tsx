import React from "react";
import Person from "./Person";
import Link from "next/link";
import { slug } from "~/utils";
import { Testimonial } from "contentful-fetch/models/testimonials";
import ContentfulRichText from "ui/common/ContentfulRichText";
import type { Document } from "ui/common/ContentfulRichText";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Autoplay,
} from "ui/components/carousel";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

const TestimonialFC: React.FC<{
  title: string;
  person: {
    name: string;
    title: string;
    linkedIn: string;
    image: {
      url: string;
    };
  };
  content: Document;
  pictures: any;
}> = ({ title, person, content, pictures }) => {
  return (
    <section className="body-font text-gray-700">
      <div className="mx-4 py-16 md:py-4">
        <div className="grid grid-cols-8">
          <div className="col-span-8 md:col-span-6 md:col-start-2">
            <div className="flex h-full w-full flex-col justify-center pb-4 text-left">
              {/* <div>
                {pictures.length > 0 &&
                  pictures.map((pic: string, index: number) => (
                    <Image
                      key={index}
                      src={pic}
                      alt={title+index}
                      width={500}
                      height={300}
                      className="rounded-lg"
                    />
                  ))}
              </div> */}
              <div className="mb-4">
                <Carousel className="mt-20 sm:mx-6">
                  <CarouselContent>
                    {pictures.map((pic, index) => (
                      <CarouselItem key={index}>
                        <Image
                          src={pic}
                          alt={title + index}
                          className="w-full rounded-md object-cover"
                          width={900}
                          height={600}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden sm:block">
                    <CarouselPrevious />
                    <CarouselNext />
                  </div>
                </Carousel>
              </div>
              <div className="text-md leading-relaxed sm:mx-6 dark:text-gray-400">
                <ContentfulRichText content={content} />
              </div>
              <div className="my-4 flex justify-center">
                <Link
                  href={`/testimonials/${slug(title)}`}
                  className="mb-1 mr-1 rounded border-2
                  border-gray-600 px-6 py-1 text-xs text-gray-700 shadow 
                  outline-none hover:shadow-md focus:outline-none active:bg-gray-600 dark:text-gray-300"
                >
                  Read
                  <ArrowRightIcon className="ml-1 inline-block h-3 w-3" />
                </Link>
              </div>
              <Person
                image={person.image.url}
                name={person.name}
                link={person.linkedIn}
                title={person.title}
                variant="profile"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialFC;

export function TestimonialCollection({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  return (
    <div>
      {testimonials.map((tm, index) => (
        <div key={index}>
          <TestimonialFC
            title={tm.headline}
            content={tm.content.json}
            person={tm.person}
            pictures={tm.pictures.items.map((i) => i.url)}
          />
          <div className="flex justify-center">
            <span className="mb-6 mt-8 inline-block h-1 w-10 rounded bg-green-500 text-center"></span>
          </div>
        </div>
      ))}
    </div>
  );
}
