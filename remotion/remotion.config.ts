import { Config } from "@remotion/cli/config";

// 1. OpenGL Backend: Use 'angle' for native Direct3D 11 WebGL hardware acceleration on Windows
Config.setChromiumOpenGlRenderer("angle");

// 2. Headless & Output Encoding Defaults
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setVideoImageFormat("jpeg");

// 3. Hardware acceleration flags for Chromium
Config.setChromiumFlags({
  "enable-webgl": true,
  "ignore-gpu-blocklist": true,
  "enable-gpu-rasterization": true,
  "enable-zero-copy": true,
});
