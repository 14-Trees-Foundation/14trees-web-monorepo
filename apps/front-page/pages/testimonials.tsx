import { Client } from "@notionhq/client";
import Testimonial from "components/TestimonialComponent";
import Head from "next/head";

export default function Testimonials({ testimonials }) {
    console.log(testimonials);
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

export async function getStaticProps() {
    const notion = new Client({
        auth: "secret_yEBfZXKrD1X1t35cqzzYO7cK521npLVFFrwZdxdh2mz",
    });

    const testimonialsDB = await notion.databases.query({
        database_id: "5e57e7be0da44fc7a3c409925daf10a5"
    });
    // const tms = await Promise.all(testimonialsDB.results.map((tm) => {
    //     notion.pages.retrieve({ page_id: tm.id });
    // }));

    const tms = []

    for(const tm of testimonialsDB.results) {
        const page = await notion.pages.retrieve({ page_id: tm.id });
        // retrieve the page blocks
        const blocks = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 50,
        });
        tms.push({
            // @ts-ignore
            author: page.properties.Author.title[0].plain_text,
            // @ts-ignore
            content: blocks.results.map(b => b.paragraph.rich_text.map(
                t => t.plain_text).join(" "))
        });
    }

    console.log(tms)

  // You may need to parse and map the data according to your needs.
  // The code below is a basic assumption.

    return {
        props: {
          testimonials: tms,
        },
    };
}
