"use client";

import React from "react";
import Image from "next/image"; // Import Next.js Image component
import person_placeholder from "~/assets/images/person_placeholder.jpeg"; // Import placeholder image
import Link from "next/link";
import { Modal } from "ui";

// Define TypeScript interfaces for props
interface PersonProps {
  image?: string;
  name: string;
  link?: string;
  title?: string;
  bio?: string;
  variant?: "large" | "profile" | "small";
}

const imageDimensions = {
  large: { width: 160, height: 160 },
  profile: { width: 80, height: 80 },
  small: { width: 40, height: 40 },
};

const Person: React.FC<PersonProps> = ({
  image,
  name,
  link,
  bio,
  title,
  variant = "large",
}) => {
  const [open, setOpen] = React.useState(false);

  const InnerPerson = () => (
    <div className="text-center md:m-4">
      <Image
        src={image || person_placeholder}
        alt=""
        className="mx-auto mb-4 aspect-square rounded-full border-2 object-cover shadow-lg"
        {...imageDimensions[variant]} // Spread the dimensions based on the variant
      />{" "}
      <div className="md:w-full">
        <p className="text-xl text-gray-600 lg:text-2xl dark:text-gray-200">
          {name}
          {title && (
            <span className="block text-lg text-gray-500">{title}</span>
          )}
        </p>
        <Modal title={name} show={open} onClose={() => setOpen(false)}>
          <Image
            src={image || person_placeholder}
            alt=""
            className="mx-auto mb-4 aspect-square rounded-full border-2 object-cover shadow-lg"
            {...imageDimensions[variant]} // Spread the dimensions based on the variant
          />
          <div className="p-4">
            <p className="text-xl text-gray-600 lg:text-2xl dark:text-gray-200">
              {name}
              {title && (
                <span className="block text-lg text-gray-500">{title}</span>
              )}
            </p>
            {bio && <p className="text-md mt-2 text-gray-500">{bio}</p>}
          </div>
        </Modal>
        <button
          className="text-xs text-gray-500 hover:text-gray-700"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          Read More
        </button>
      </div>
    </div>
  );
  return link ? (
    <section>
      <Link href={link || "#"}>
        <InnerPerson />
      </Link>
      {/* Repeat for other variants with corresponding JSX and Next.js Image components */}
    </section>
  ) : (
    <section>
      <InnerPerson />
    </section>
  );
};

export default Person;
