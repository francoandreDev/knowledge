// The roadmap and the home page group the worlds into regions so 18 islands
// read as a place, not a list. Any world not named here lands in a catch-all
// region, so adding a track to ROADMAP.md never makes it vanish.
export const REGIONS = [
  {
    id: "workshop",
    title: "The Workshop",
    tagline: "Build, ship and secure real systems.",
    tracks: [
      "web",
      "systems",
      "git-teamwork",
      "infra-delivery",
      "security",
      "testing-quality",
      "software-design",
      "architecture",
    ],
  },
  {
    id: "observatory",
    title: "The Observatory",
    tagline: "Think clearly, model the world, shape what people use.",
    tracks: [
      "logic",
      "applied-math",
      "learning-craft",
      "design",
      "product-domain",
    ],
  },
  {
    id: "harbor",
    title: "The Harbor",
    tagline: "Work with people, grow a career, lead teams.",
    tracks: [
      "business-communication",
      "career-craft",
      "corporate-politics",
      "people-management",
      "sustainable-performance",
    ],
  },
];
