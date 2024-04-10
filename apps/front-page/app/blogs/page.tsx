import contentful from "contentful-fetch";
import { BlogPost } from "contentful-fetch/models/blogs";
import { Modal } from "ui";
import Image from "next/image";
import Person from "components/Person";

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
    <div className="min-h-screen bg-white p-32">
      <h1 className="title-text mb-24 text-center">Blogs</h1>
      <div className="grid grid-cols-2 gap-4">
        {blogs?.map((b) => {
          return (
            <div
              key={b.title}
              className="mb-8 flex flex-col rounded-md border p-8 shadow-md"
            >
              <h2 className="border-b py-4 text-2xl font-bold">{b.title}</h2>
              <Image src={b.imageUrl} alt={b.title} width={800} height={600} />
              <p className="h-40 flex-grow overflow-hidden text-ellipsis pt-4 text-gray-600">
                {b.content}
              </p>
              <Person
                name={b.person.name}
                title={b.person.title}
                variant="inline"
                link={b.person.linkedIn}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Blogs;
