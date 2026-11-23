import { adminAssetPath } from "@/utils/asset-path";

export const avatarSizes = [
  {
    id: 1,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    size: "xs",
  },
  {
    id: 2,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    size: "sm",
  },
  {
    id: 3,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    size: "md",
  },
  {
    id: 4,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    size: "lg",
  },
  {
    id: 5,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    size: "xl",
  },
  {
    id: 6,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    size: "xxl",
  },
] as const;

export const teamMembersWithStatus = [
  {
    id: 1,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    status: "none",
  },
  {
    id: 2,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    status: "online",
  },
  {
    id: 3,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    status: "offline",
  },
  {
    id: 4,
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
    fallback: "AT",
    status: "busy",
  },
] as const;

export const teamMembersGroup = [
  {
    src: adminAssetPath("/images/user/jhon-smith.png"),
    alt: "Ahmed Tusar",
  },
  {
    src: adminAssetPath("/images/user/alex-rodriguez.png"),
    alt: "James Lue",
  },
  {
    src: adminAssetPath("/images/user/michael-brown.png"),
    alt: "David Lorin",
  },
];
