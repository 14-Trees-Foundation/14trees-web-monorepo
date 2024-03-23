import { testimonialsQuery } from "./models/testimonials";
import { iitkSlidesQuery, vetaleSlidesQuery } from "./models/slides";

export const queries = {
  testimonials: testimonialsQuery,
  "iitk-slides": iitkSlidesQuery,
  "vetale-slides": vetaleSlidesQuery
};

type Queries = typeof queries;

type QueryName = keyof typeof queries;

async function fetchGraphQL(
  queryName: QueryName,
  preview = false
): Promise<any> {
  const query = queries[queryName];
  const contentfulUrl = `https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`;
  const fetchOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${
        preview
          ? process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN
          : process.env.CONTENTFUL_ACCESS_TOKEN
      }`,
    },
    body: JSON.stringify({ query }),
    // next: { tags: ["posts"] },
  };
  try {
    const data = await fetch(contentfulUrl, fetchOptions).then((response) =>
      response.json()
    );
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Could not fetch data from Contentful!");
  }
}

export default async function contentfulFetch(
  query: QueryName,
  preview = false
) {
  const response = await fetchGraphQL(query, preview);
  return response.data;
}
