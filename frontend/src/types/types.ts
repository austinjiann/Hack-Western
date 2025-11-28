export interface NavItem {
  label: string;
  href: string;
}

export interface VideoClip {
  videoUrl: string;
  trimEnd?: number;
  duration?: number;
}
