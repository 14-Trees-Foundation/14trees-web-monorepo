"use client";

import Person from "components/Person";
import { useState } from "react";
import { Modal } from "ui";
import Image from "next/image";

export const BlogCard = ({ external, title, imageUrl, person, content }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-8 flex h-full flex-col rounded-md border p-8 shadow-md">
      <h2 className="min-h-32 py-4 text-3xl font-light">{title}</h2>
      <div className="aspect-[3/2] w-full">
        <div className="relative h-full w-full">
          <Image
            src={imageUrl}
            layout="fill"
            alt={title}
            objectFit="cover"
            className="rounded-md"
          />
        </div>
      </div>
      {!external && (
        <Modal
          panelClass="w-3/4 "
          title={title}
          show={open}
          onClose={() => setOpen(false)}
        >
          <div className="mt-4 p-6">
            <div className="mx-auto md:w-1/2">
              <Person
                variant="large"
                name={person.name}
                title={person.title}
                link={person.linkedIn}
              />
            </div>
            <div className="my-6 aspect-[3/2] w-full">
              <div className="relative h-full w-full">
                <Image
                  src={imageUrl}
                  layout="fill"
                  alt={title}
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            </div>
            <div className="py-4 text-lg">{content}</div>
          </div>
        </Modal>
      )}

      <p
        onClick={() => setOpen(true)}
        className="h-40 flex-grow overflow-hidden text-ellipsis py-2 pt-4 text-gray-600"
      >
        {content}
      </p>
      <Person
        name={person.name}
        title={person.title}
        variant="inline"
        link={person.linkedIn}
      />
    </div>
  );
};
