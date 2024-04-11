import contentful from "contentful-fetch";
import { BlogPost } from "contentful-fetch/models/blogs";
import Link from "next/link";
import { BlogCard } from "components/Partials/BlogCard";
import { Fragment } from "react";

async function getData() {
  try {
    const blogs: BlogPost[] = await contentful("blogs");
    return blogs;
  } catch (error) {
    console.error(error);
    return null;
  }
}

const Blogs = async () => {
  const blogs = await getData();
  return (
    <div className="container min-h-screen bg-white md:p-32 my-40">
      <h1 className="title-text mb-24 text-center">Blogs</h1>
      <div className="grid md:grid-cols-2 gap-12">
        {blogs?.map((b) => 
          (b.external && b.link) ? (
            <Link key={b.title} href={b.link}>
              <BlogCard {...b} />
            </Link>
          ) : (
            <Fragment key={b.title}>
              <BlogCard {...b} />
            </Fragment>
          )
        )}
      </div>
    </div>
  )
};

export default Blogs;
