import React from 'react';
import Image from 'next/image'; // Import Next.js Image component

// Define TypeScript interfaces for props
interface PersonProps {
  image: any; // You should replace 'any' with a more specific type according to your image object structure
  name: string;
  linkedIn?: string;
  title: string;
  variant?: 'large' | 'profile' | 'small';
}

const Person: React.FC<PersonProps> = ({ image, name, linkedIn, title, variant = 'large' }) => {

  return (
    <section>
      {variant === 'large' && (
        <div className="flex items-center md:ml-4">
          <Image src={image} alt="" className="object-contain md:h-32 h-24 content-right" width={128} height={128} /> {/* Adjust width and height as needed */}
          <div className="ml-6 md:w-full">
            <div className="inline-flex w-full justify-start">
              <p className="text-gray-900 dark:text-gray-200 lg:text-xl text-lg mr-1">{name}</p>
              {linkedIn && (
                <div className="flex items-center">
                  <a href={linkedIn} target="_blank" rel="noopener noreferrer">
                    {/* Inline SVG or an SVG component */}
                  </a>
                </div>
              )}
            </div>
            {/* Other JSX */}
          </div>
        </div>
      )}

      {/* Repeat for other variants with corresponding JSX and Next.js Image components */}

    </section>
  );
};

export default Person;
