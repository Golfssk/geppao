import type { NextConfig } from 'next';
const nextConfig: NextConfig = { reactStrictMode: true, async redirects(){return [{source:'/go',destination:'/',permanent:true}];} };
export default nextConfig;
