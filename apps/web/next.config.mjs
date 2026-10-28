/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@buildbrief/domain', '@buildbrief/store', '@buildbrief/learning', '@buildbrief/verifier', '@buildbrief/repo', '@buildbrief/model-meta'],
};

export default nextConfig;
