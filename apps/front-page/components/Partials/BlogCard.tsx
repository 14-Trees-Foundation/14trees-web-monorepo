"use client";

import Person from "components/Person";
import { useState } from "react";
import { Modal } from "ui";
import Image from "next/image";
import Link from "next/link";

export const BlogCard = ({
  external,
  href,
  title,
  imageUrl,
  person,
  content,
}) => {
  const [open, setOpen] = useState(false);
  const Card = () => (
    <div className="mb-8 flex h-[40rem] flex-col rounded-2xl border border-gray-100 p-2.5 shadow-md">
      <div className="aspect-video w-full flex-shrink-0">
        <div className="relative h-full w-full">
          <Image
            src={imageUrl}
            fill
            alt={title}
            className="rounded-md object-cover"
          />
        </div>
      </div>
      <h2 className="mt-4 px-6 text-center text-xl font-light">{title}</h2>
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

      <div className="flex-shrink overflow-hidden px-2">
        <p
          onClick={() => setOpen(true)}
          className="mt-2 flex-grow overflow-hidden text-ellipsis py-2 text-sm font-light text-gray-600"
        >
          {content}
        </p>
      </div>
      <div className="flex-grow content-end p-2">
        <Person
          name={person.name}
          title={person.title}
          variant="inline"
          link={person.linkedIn}
        />
      </div>
    </div>
  );

  return (external && href) ? (
    <Link href={href}>
      <Card />
    </Link>
  ) : (
    <Card />
  );
};
