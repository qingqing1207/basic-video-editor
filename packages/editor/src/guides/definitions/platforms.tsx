import { HugeiconsIcon } from "@hugeicons/react";
import {
  TiktokIcon,
  InstagramIcon,
  YoutubeIcon,
  SnapchatIcon,
} from "@hugeicons/core-free-icons";
import type { GuideDefinition } from "@/guides/types";
import { TikTokLayout } from "./tiktok-layout";

const platformIcons = {
  "tiktok.com": TiktokIcon,
  "instagram.com": InstagramIcon,
  "youtube.com": YoutubeIcon,
  "snapchat.com": SnapchatIcon,
};
function PlatformLogo({
  domain,
  className = "size-4",
}: {
  domain: string;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={platformIcons[domain as keyof typeof platformIcons]}
      className={className}
      aria-hidden="true"
    />
  );
}

function PlatformGuidePreview({ domain }: { domain: string }) {
  return <PlatformLogo domain={domain} />;
}

function platformGuide({
  id,
  label,
  domain,
}: {
  id: string;
  label: string;
  domain: string;
}): GuideDefinition {
  return {
    id,
    label,
    renderPreview: () => <PlatformGuidePreview domain={domain} />,
    renderTriggerIcon: () => <PlatformLogo domain={domain} />,
    renderOverlay: () => null,
  };
}

export const tiktokGuide: GuideDefinition = {
  ...platformGuide({ id: "tiktok", label: "TikTok", domain: "tiktok.com" }),
  renderOverlay: () => <TikTokLayout />,
};
export const igReelsGuide = platformGuide({
  id: "ig-reels",
  label: "Reels",
  domain: "instagram.com",
});
export const ytShortsGuide = platformGuide({
  id: "yt-shorts",
  label: "Shorts",
  domain: "youtube.com",
});
export const spotlightGuide = platformGuide({
  id: "spotlight",
  label: "Spotlight",
  domain: "snapchat.com",
});
