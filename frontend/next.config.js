/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  env: {
    NEXT_PUBLIC_STACKS_API: process.env.NEXT_PUBLIC_STACKS_API || "https://api.testnet.hiro.so",
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "ST1PQHQV0W8CRUMB6QVQ0GKWC54BB2XDC13Q6X69H.stacksafe",
  },
};

module.exports = nextConfig;
