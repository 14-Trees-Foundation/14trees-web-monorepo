import contentful from "contentful-fetch";
import { BlogPost } from "contentful-fetch/models/blogs";
import { BlogCard } from "components/Partials/BlogCard";

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
    <div className="container min-h-screen bg-white md:p-12 my-40">
      <h1 className="title-text mb-24 text-center">Blogs</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {blogs?.map((b) => 
            <div  key={b.title} >
              <BlogCard {...b} href={(b.external && b.link) ? b.link : undefined}/>
            </div>
        )}
      </div>
    </div>
  )
};

export default Blogs;
