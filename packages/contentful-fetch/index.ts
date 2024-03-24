import { testimonialsQuery } from "./models/testimonials";
import { iitkSlidesQuery, vetaleSlidesQuery } from "./models/slides";
import { blogsQuery, mergeBlogPosts } from "./models/blogs";

export const queries = {
  testimonials: {
    query: testimonialsQuery,
    transform: null,
  },
  "iitk-slides": {
    query: iitkSlidesQuery,
    transform: null,
  },
  "vetale-slides": {
    query: vetaleSlidesQuery,
    transform: null,
  },
  blogs: {
    query: blogsQuery,
    transform: mergeBlogPosts,
  },
};

type Queries = typeof queries;

type QueryName = keyof typeof queries;

async function fetchGraphQL(
  queryName: QueryName,
  preview = false
): Promise<any> {
  const { query, transform } = queries[queryName];
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
      console.error(data.errors[0].message);
    }
    if (!data.data) {
      throw new Error("Could not fetch data from Contentful!", data.errors);
    }
    const result = transform ? transform(data) : data;
    return result;
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
