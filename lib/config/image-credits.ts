/**
 * Attribution for the seeded leaderboard reference photos.
 *
 * Every entry here is CC BY-SA, which requires crediting the author and naming
 * the licence wherever the image is shown. Author and licence were read off the
 * Commons file page (extmetadata Artist / LicenseShortName), not assumed.
 *
 * Keep in sync with `commonsFile` in `scripts/seed.ts`. Requests seeded without
 * a licence-clean source have no entry here because they render the monogram
 * placeholder instead.
 *
 * Not rendered anywhere at the moment. The photos are only uploaded when
 * AZURE_STORAGE_* is configured, and none are live yet, so there is nothing to
 * attribute. Surface this list again before those images ship.
 */

export type ImageCredit = {
  /** Leaderboard request this photo illustrates. */
  subject: string;
  author: string;
  license: string;
  licenseUrl: string;
  /** Commons file page, so the credit is verifiable. */
  sourceUrl: string;
};

export const IMAGE_CREDITS: ImageCredit[] = [
  {
    subject: "Gold football trophy",
    author: "Ank Kumar",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:FIFA_World_Cup_Trophy_(Jules_Rimet_Trophy)_at_National_Football_Museum,_Manchester_02.jpg",
  },
  {
    subject: "Half marathon finisher medal",
    author: "Ykekaixin",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:2015_Shanghai_half_marathon_medal.jpg",
  },
  {
    subject: "RoboCup ball",
    author: "CAPS LOCK, background by Kmf164",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Soccerball.png",
  },
  {
    subject: "IPO gong and mallet",
    author: "Eric Bajart",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Gong_bali.jpg",
  },
  {
    subject: "Traffic cone",
    author: "JerkyBoy",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Traffic_Cone.jpg",
  },
];
