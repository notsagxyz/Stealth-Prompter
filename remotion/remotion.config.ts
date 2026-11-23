import { Config } from "@remotion/cli/config";

// Output Encoding Defaults
Config.setOverwriteOutput(true);
Config.setPixelFormat("yuv420p");
Config.setVideoImageFormat("jpeg");
Config.setChromiumOpenGlRenderer("swangle");
Config.setChromiumDisableWebSecurity(true);
Config.setChromiumIgnoreCertificateErrors(true);

// Increase timeouts for WebGL / Three.js bundle evaluation
Config.setTimeoutInMilliseconds(180000);
Config.setDelayRenderTimeoutInMilliseconds(180000);
