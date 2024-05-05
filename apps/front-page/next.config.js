/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    // "images.unsplash.com",
    // "s3.us-west-2.amazonaws.com",
    // "prod-files-secure.s3.us-west-2.amazonaws.com",
    // "images.ctfassets.net",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname:
          "14trees-public-assets.s3.ap-south-1.amazonaws.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
        port: "",
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["schema", "ui", "notion-sync", "contentful-fetch"],
  // use NEXT_PUBLIC_RAZORPAY_KEY env variable
  env: {
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  },
  redirects: async () => {
    return [
      {
        source: "/80g",
        destination:
          "https://14trees-public-assets.s3.ap-south-1.amazonaws.com/14trees_80g.pdf",
        permanent: true,
      },
      {
        source: "/donate",
        destination:
          "https://docs.google.com/forms/d/e/1FAIpQLSfumyti7x9f26BPvUb0FDYzI2nnuEl5HA63EO8svO3DG2plXg/viewform",
        permanent: true,
      },
      {
        source: "/volunteer",
        destination:
          "https://docs.google.com/forms/d/1GMOqEe605KweKR2aLxPRJKrUtHGhbVdFm4B5GrCisnU",
        permanent: true,
      },
    ];
  },
  // canvas false
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};
