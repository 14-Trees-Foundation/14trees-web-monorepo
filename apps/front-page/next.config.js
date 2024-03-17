/** @type {import('next').NextConfig} */
module.exports = {
  images: {
      // "images.unsplash.com",
      // "s3.us-west-2.amazonaws.com",
      // "prod-files-secure.s3.us-west-2.amazonaws.com",
      // "images.ctfassets.net",
    remotePatterns: [
      {
          protocol: 'https',
          hostname: 'images.unsplash.com',
          port: ""
      },
      {
          protocol: 'https',
          hostname: 's3.us-west-2.amazonaws.com',
          port: ""
      },
      {
          protocol: 'https',
          hostname: 'prod-files-secure.s3.us-west-2.amazonaws.com',
          port: ""
      },
      {
          protocol: 'https',
          hostname: 'images.ctfassets.net',
          port: ""
      }
    ],
  },
  reactStrictMode: true,
  transpilePackages: ["schema", "ui", "notion-sync", "contentful-fetch"],
  // use NEXT_PUBLIC_RAZORPAY_KEY env variable
  env: {
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  },
};
