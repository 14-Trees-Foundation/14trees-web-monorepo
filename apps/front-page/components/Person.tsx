import React from "react";
import Image from "next/image"; // Import Next.js Image component
import person_placeholder from "~/assets/images/person_placeholder.jpeg"; // Import placeholder image

// Define TypeScript interfaces for props
interface PersonProps {
  image: any; // You should replace 'any' with a more specific type according to your image object structure
  name: string;
  linkedIn?: string;
  title?: string;
  bio?: string;
  variant?: "large" | "profile" | "small";
}

const Person: React.FC<PersonProps> = ({
  image,
  name,
  linkedIn,
  bio,
  title,
  variant = "large",
}) => {
  return (
    <section>
      <div className="text-center md:m-4">
        <Image
          src={image || person_placeholder}
          alt=""
          className="mx-auto mb-4 h-40 w-40 rounded-full border-2 object-cover shadow-lg"
          width={160}
          height={160}
        />{" "}
        {/* Adjust width and height as needed */}
        <div className="md:w-full">
          <p className="text-xl text-gray-600 dark:text-gray-200 lg:text-2xl">
            {name}
            {title && (
              <span className="block text-lg text-gray-500">{title}</span>
            )}
          </p>
          {linkedIn && (
            <div className="flex items-center">
              <a href={linkedIn} target="_blank" rel="noopener noreferrer">
                {/* Inline SVG or an SVG component */}
              </a>
            </div>
          )}
          {bio && <p className="mt-2 text-gray-600">{bio}</p>}
        </div>
      </div>
      {/* Repeat for other variants with corresponding JSX and Next.js Image components */}
    </section>
  );
};

export default Person;