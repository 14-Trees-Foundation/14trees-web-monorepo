/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: ["images.unsplash.com", "s3.us-west-2.amazonaws.com", "prod-files-secure.s3.us-west-2.amazonaws.com"],
  },
  reactStrictMode: true,
  transpilePackages: ["schema", "ui"],
  // use NEXT_PUBLIC_RAZORPAY_KEY env variable
  env: {
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  }
};
