import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the segmentation model and its native runtime out of the server bundle.
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "onnxruntime-node",
    "sharp",
  ],
};

export default nextConfig;
