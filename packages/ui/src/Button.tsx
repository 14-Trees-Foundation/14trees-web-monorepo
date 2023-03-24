import * as React from "react";

export const Button = () => {
  return (
    <div className="rounded-md bg-blue-800 p-4">
      <a href="https://turbo.build/repo/docs">
        <div className="flex w-full items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium no-underline bg-white text-black hover:bg-gray-300 md:py-3 md:px-10 md:text-lg md:leading-6">
          <div className="text-3xl">Read the docs man</div>
          <span className="ml-12 bg-gradient-to-r from-brandred to-brandblue bg-clip-text">
            →
          </span>
        </div>
      </a>
    </div>
  );
};
