import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build, so the Docker image only needs the runtime.
  output: "standalone",

  // Keep the segmentation model and its native runtime out of the server bundle.
  serverExternalPackages: [
    "@imgly/background-removal-node",
    "onnxruntime-node",
    "sharp",
  ],

  // Tracing misses these: the model chunks are read from disk at runtime, and
  // libonnxruntime is dlopen'd by the native binding rather than required.
  // Only the Linux runtimes are shipped, since that is what we deploy on.
  outputFileTracingIncludes: {
    "/api/remove-background": [
      "./node_modules/@imgly/background-removal-node/dist/**",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/**",
    ],
  },
};

export default nextConfig;
