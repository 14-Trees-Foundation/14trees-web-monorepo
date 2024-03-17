import { Document } from '@contentful/rich-text-types';

export const testimonialsQuery = `
query {
  testimonialCollection(limit:20) {
    items {
      headline
      pictures: picturesCollection(limit: 3){
        items {
          url
        }
      }
      content{
        json
      }
      campaign {
        heading
      }
      person {
        name
        title
        linkedIn
        image {
          url
        }
      }
    }
  }
}
`;

export type Testimonial = {
    headline: string;
    pictures: {
      items: {
        url: string;
      }[];
    }
    content: {
        json: Document;
    };
    campaign: {
        heading: string;
    };
    person: {
        name: string;
        title: string;
        linkedIn: string;
        image: {
          url: string;
        };
    };
};