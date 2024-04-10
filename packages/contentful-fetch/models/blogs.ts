import { Document } from "@contentful/rich-text-types";

export const blogsQuery = `
{  
  blogPostCollection(limit:20) {
    items {
      __typename
      title
      body
      description
      author {
        linkedIn
        name
        image {
          url
        }
      }
      heroImage {
        title
        description
        fileName
        url
      }
    }
  }
  articlePreviewCollection(limit:20) {
    items {
      __typename
      link
      headline
      previewImage {
        title
        url
      }
      content
      author {
        name
        linkedIn
        image {
          url
        }
      }
    }
  }
}
    
`;

export function mergeBlogPosts(response: any): { data: BlogPost[] } {
  const posts: BlogPost[] = [];
  posts.push(
    ...response.data.blogPostCollection.items.map((post: any) => {
      return {
        external: true,
        title: post.title,
        imageUrl: post.heroImage.url,
        content: post.body,
        person: {
          name: post.author.name,
          title: "",
          linkedIn: post.author.linkedIn,
          image: {
            url: post.author.image.url,
          },
        },
      };
    })
  );

  posts.push(
    ...response.data.articlePreviewCollection.items.map((post: any) => {
      return {
        external: true,
        title: post.headline,
        imageUrl: post.previewImage?.url,
        content: post.content,
        person: {
          name: post.author.name,
          title: "",
          linkedIn: post.author.linkedIn,
          image: {
            url: post.author.image.url,
          },
        },
      };
    })
  );

  return {
    data: posts,
  };
}

export type BlogPost = {
  external: boolean;
  title: string;
  imageUrl: string;
  content: string;
  link?: string;
  person: {
    name: string;
    title: string;
    linkedIn: string;
    image: {
      url: string;
    };
  };
};
