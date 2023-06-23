/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // transpilePackages: ["schema", "ui"],
  // use NEXT_PUBLIC_RAZORPAY_KEY env variable
  env: {
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  }
};
