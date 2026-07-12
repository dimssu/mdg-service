import { Config } from '@remotion/cli/config';

// Portrait, phone-first tutorials. Rendered as MP4 (H.264) by default.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
