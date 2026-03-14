export type ValidationSource = "BlueGolf" | "GolfTraxx" | "GolfPass" | "MyPhillyGolf" | null;

export interface Course {
  id: string;
  name: string;
  location: string;
  city: string;
  region: string;
  country: string;
  holes: number;
  par: number;
  yardage: number;
  status: "open" | "closed";
  established: number;
  designer: string;
  scorecard: { hole: number; yards: number; par: number }[];
  validated?: boolean;
  bluegolfId?: string;
  validationSource?: ValidationSource;
  sourceUrl?: string;
}

export interface PosterToggles {
  showLocation: boolean;
  showYardagePar: boolean;
  showScorecard: boolean;
  showCourseFacts: boolean;
  showHoleNumbers: boolean;
}

export const DEFAULT_POSTER_TOGGLES: PosterToggles = {
  showLocation: true,
  showYardagePar: true,
  showScorecard: true,
  showCourseFacts: true,
  showHoleNumbers: true,
};

export interface CanvasSize {
  id: string;
  label: string;
  dimensions: string;
  price: number;
}

export type PosterStyleId = "classic" | "dark" | "vintage" | "blueprint" | "watercolor" | "minimalist";

export interface PosterStyle {
  id: PosterStyleId;
  label: string;
  description: string;
}

export const POSTER_STYLES: PosterStyle[] = [
  { id: "classic", label: "Classic", description: "Clean white with green fairways" },
  { id: "dark", label: "Dark Mode", description: "Elegant dark background" },
  { id: "vintage", label: "Vintage", description: "Aged parchment feel" },
  { id: "blueprint", label: "Blueprint", description: "Architectural blueprint style" },
  { id: "watercolor", label: "Watercolor", description: "Soft painted aesthetic" },
  { id: "minimalist", label: "Minimalist", description: "Ultra-clean line art" },
];

export interface SavedPoster {
  id: string;
  courseId: string;
  styleId: PosterStyleId;
  savedAt: number;
  isFavorite: boolean;
}

export type CollectionId = "played" | "dream" | "historic";

export interface Collection {
  id: CollectionId;
  label: string;
  icon: string;
  description: string;
}

export const COLLECTIONS: Collection[] = [
  { id: "played", label: "Courses I've Played", icon: "⛳", description: "Your personal rounds" },
  { id: "dream", label: "Dream Courses", icon: "✨", description: "Bucket list courses" },
  { id: "historic", label: "Historic Courses", icon: "🏛️", description: "Legendary & heritage courses" },
];

export const CANVAS_SIZES: CanvasSize[] = [
  { id: "12x16", label: '12" × 16"', dimensions: "12×16", price: 49 },
  { id: "18x24", label: '18" × 24"', dimensions: "18×24", price: 79 },
  { id: "24x36", label: '24" × 36"', dimensions: "24×36", price: 119 },
  { id: "36x48", label: '36" × 48"', dimensions: "36×48", price: 179 },
];

export const PLANS = [
  { id: "yearly", label: "Annual", price: "$0.57", period: "/week", subtitle: "$29.99/year", tag: "Best Value" },
  { id: "weekly", label: "1 Week", price: "$6.99", period: "/week", subtitle: "One-time", tag: null },
] as const;

const generateScorecard = (_par: number, seed = 0): { hole: number; yards: number; par: number }[] => {
  const holes = [];
  const pars = [4, 5, 3, 4, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5];
  for (let i = 0; i < 18; i++) {
    const holePar = pars[(i + seed) % pars.length];
    const yards = holePar === 3 ? 140 + ((seed + i * 37) % 80) : holePar === 4 ? 350 + ((seed + i * 53) % 100) : 480 + ((seed + i * 41) % 100);
    holes.push({ hole: i + 1, yards, par: holePar });
  }
  return holes;
};

const generate9Scorecard = (): { hole: number; yards: number; par: number }[] => {
  const pars = [4, 3, 5, 4, 4, 3, 4, 5, 4];
  return pars.map((p, i) => ({
    hole: i + 1,
    yards: p === 3 ? 150 + (i * 17 % 60) : p === 4 ? 360 + (i * 29 % 80) : 490 + (i * 23 % 70),
    par: p,
  }));
};

// Verified real scorecards for iconic courses
const REAL_SCORECARDS: Record<string, { hole: number; yards: number; par: number }[]> = {
  "augusta-national": [
    { hole: 1, yards: 445, par: 4 }, { hole: 2, yards: 585, par: 5 }, { hole: 3, yards: 350, par: 4 },
    { hole: 4, yards: 240, par: 3 }, { hole: 5, yards: 495, par: 4 }, { hole: 6, yards: 180, par: 3 },
    { hole: 7, yards: 450, par: 4 }, { hole: 8, yards: 570, par: 5 }, { hole: 9, yards: 460, par: 4 },
    { hole: 10, yards: 495, par: 4 }, { hole: 11, yards: 520, par: 4 }, { hole: 12, yards: 155, par: 3 },
    { hole: 13, yards: 545, par: 5 }, { hole: 14, yards: 440, par: 4 }, { hole: 15, yards: 550, par: 5 },
    { hole: 16, yards: 170, par: 3 }, { hole: 17, yards: 440, par: 4 }, { hole: 18, yards: 465, par: 4 },
  ],
  "pebble-beach": [
    { hole: 1, yards: 381, par: 4 }, { hole: 2, yards: 516, par: 5 }, { hole: 3, yards: 404, par: 4 },
    { hole: 4, yards: 331, par: 4 }, { hole: 5, yards: 195, par: 3 }, { hole: 6, yards: 523, par: 5 },
    { hole: 7, yards: 106, par: 3 }, { hole: 8, yards: 428, par: 4 }, { hole: 9, yards: 504, par: 4 },
    { hole: 10, yards: 446, par: 4 }, { hole: 11, yards: 390, par: 4 }, { hole: 12, yards: 202, par: 3 },
    { hole: 13, yards: 445, par: 4 }, { hole: 14, yards: 580, par: 5 }, { hole: 15, yards: 397, par: 4 },
    { hole: 16, yards: 403, par: 4 }, { hole: 17, yards: 178, par: 3 }, { hole: 18, yards: 543, par: 5 },
  ],
  "st-andrews": [
    { hole: 1, yards: 376, par: 4 }, { hole: 2, yards: 453, par: 4 }, { hole: 3, yards: 397, par: 4 },
    { hole: 4, yards: 480, par: 4 }, { hole: 5, yards: 568, par: 5 }, { hole: 6, yards: 412, par: 4 },
    { hole: 7, yards: 371, par: 4 }, { hole: 8, yards: 175, par: 3 }, { hole: 9, yards: 352, par: 4 },
    { hole: 10, yards: 386, par: 4 }, { hole: 11, yards: 174, par: 3 }, { hole: 12, yards: 348, par: 4 },
    { hole: 13, yards: 465, par: 4 }, { hole: 14, yards: 618, par: 5 }, { hole: 15, yards: 455, par: 4 },
    { hole: 16, yards: 424, par: 4 }, { hole: 17, yards: 495, par: 4 }, { hole: 18, yards: 357, par: 4 },
  ],
  "pinehurst-no2": [
    { hole: 1, yards: 404, par: 4 }, { hole: 2, yards: 502, par: 4 }, { hole: 3, yards: 379, par: 4 },
    { hole: 4, yards: 566, par: 5 }, { hole: 5, yards: 482, par: 4 }, { hole: 6, yards: 223, par: 3 },
    { hole: 7, yards: 407, par: 4 }, { hole: 8, yards: 489, par: 4 }, { hole: 9, yards: 190, par: 3 },
    { hole: 10, yards: 614, par: 5 }, { hole: 11, yards: 478, par: 4 }, { hole: 12, yards: 408, par: 4 },
    { hole: 13, yards: 384, par: 4 }, { hole: 14, yards: 483, par: 4 }, { hole: 15, yards: 206, par: 3 },
    { hole: 16, yards: 531, par: 5 }, { hole: 17, yards: 198, par: 3 }, { hole: 18, yards: 444, par: 4 },
  ],
};


export const MOCK_COURSES: Course[] = [
  // Verified iconic courses
  {
    id: "augusta-national", name: "Augusta National Golf Club", location: "Augusta, Georgia, USA",
    city: "Augusta", region: "Georgia", country: "USA", holes: 18, par: 72, yardage: 7475,
    status: "open", established: 1933, designer: "Alister MacKenzie & Bobby Jones", scorecard: REAL_SCORECARDS["augusta-national"],
    validated: true, bluegolfId: "bg-augusta-national",
  },
  {
    id: "pebble-beach", name: "Pebble Beach Golf Links", location: "Pebble Beach, California, USA",
    city: "Pebble Beach", region: "California", country: "USA", holes: 18, par: 72, yardage: 6972,
    status: "open", established: 1919, designer: "Jack Neville & Douglas Grant", scorecard: REAL_SCORECARDS["pebble-beach"],
    validated: true, bluegolfId: "bg-pebble-beach",
  },
  {
    id: "st-andrews", name: "St Andrews Old Course", location: "St Andrews, Fife, Scotland",
    city: "St Andrews", region: "Fife", country: "Scotland", holes: 18, par: 72, yardage: 7305,
    status: "open", established: 1552, designer: "Old Tom Morris", scorecard: REAL_SCORECARDS["st-andrews"],
    validated: true, bluegolfId: "bg-st-andrews",
  },
  {
    id: "pinehurst-no2", name: "Pinehurst No. 2", location: "Pinehurst, North Carolina, USA",
    city: "Pinehurst", region: "North Carolina", country: "USA", holes: 18, par: 72, yardage: 7588,
    status: "open", established: 1907, designer: "Donald Ross", scorecard: REAL_SCORECARDS["pinehurst-no2"],
    validated: true, bluegolfId: "bg-pinehurst-no2",
  },
  {
    id: "cypress-point", name: "Cypress Point Club", location: "Pebble Beach, California, USA",
    city: "Pebble Beach", region: "California", country: "USA", holes: 18, par: 72, yardage: 6509,
    status: "open", established: 1928, designer: "Alister MacKenzie", scorecard: generateScorecard(72, 1),
    validated: true, bluegolfId: "bg-cypress-point",
  },
  {
    id: "royal-melbourne", name: "Royal Melbourne Golf Club", location: "Melbourne, Victoria, Australia",
    city: "Melbourne", region: "Victoria", country: "Australia", holes: 18, par: 72, yardage: 6980,
    status: "open", established: 1891, designer: "Alister MacKenzie", scorecard: generateScorecard(72, 2),
    validated: true, bluegolfId: "bg-royal-melbourne",
  },
  {
    id: "merion", name: "Merion Golf Club (East)", location: "Ardmore, Pennsylvania, USA",
    city: "Ardmore", region: "Pennsylvania", country: "USA", holes: 18, par: 70, yardage: 6846,
    status: "open", established: 1912, designer: "Hugh Wilson", scorecard: generateScorecard(70, 3),
    validated: true, bluegolfId: "bg-merion-east",
  },
  {
    id: "turnberry", name: "Trump Turnberry (Ailsa)", location: "Turnberry, Ayrshire, Scotland",
    city: "Turnberry", region: "Ayrshire", country: "Scotland", holes: 18, par: 72, yardage: 7489,
    status: "open", established: 1901, designer: "Mackenzie Ross", scorecard: generateScorecard(72, 4),
    validated: true, bluegolfId: "bg-turnberry",
  },
  {
    id: "royal-county-down", name: "Royal County Down", location: "Newcastle, County Down, Northern Ireland",
    city: "Newcastle", region: "County Down", country: "Northern Ireland", holes: 18, par: 71, yardage: 7186,
    status: "open", established: 1889, designer: "Old Tom Morris", scorecard: generateScorecard(71, 5),
    validated: true, bluegolfId: "bg-royal-county-down",
  },
  {
    id: "shinnecock-hills", name: "Shinnecock Hills Golf Club", location: "Southampton, New York, USA",
    city: "Southampton", region: "New York", country: "USA", holes: 18, par: 70, yardage: 7060,
    status: "open", established: 1891, designer: "William Flynn", scorecard: generateScorecard(70, 6),
    validated: true, bluegolfId: "bg-shinnecock",
  },
  {
    id: "royal-portrush", name: "Royal Portrush Golf Club", location: "Portrush, County Antrim, Northern Ireland",
    city: "Portrush", region: "County Antrim", country: "Northern Ireland", holes: 18, par: 72, yardage: 7317,
    status: "open", established: 1888, designer: "Harry Colt", scorecard: generateScorecard(72, 7),
    validated: true, bluegolfId: "bg-royal-portrush",
  },
  {
    id: "muirfield", name: "Muirfield (The Honourable Company)", location: "Gullane, East Lothian, Scotland",
    city: "Gullane", region: "East Lothian", country: "Scotland", holes: 18, par: 71, yardage: 7245,
    status: "open", established: 1891, designer: "Old Tom Morris & Harry Colt", scorecard: generateScorecard(71, 8),
    validated: true, bluegolfId: "bg-muirfield",
  },
  {
    id: "carnoustie", name: "Carnoustie Golf Links", location: "Carnoustie, Angus, Scotland",
    city: "Carnoustie", region: "Angus", country: "Scotland", holes: 18, par: 72, yardage: 7402,
    status: "open", established: 1842, designer: "Allan Robertson & James Braid", scorecard: generateScorecard(72, 9),
    validated: true, bluegolfId: "bg-carnoustie",
  },
  {
    id: "oakmont", name: "Oakmont Country Club", location: "Oakmont, Pennsylvania, USA",
    city: "Oakmont", region: "Pennsylvania", country: "USA", holes: 18, par: 71, yardage: 7255,
    status: "open", established: 1903, designer: "Henry Fownes", scorecard: generateScorecard(71, 10),
    validated: true, bluegolfId: "bg-oakmont",
  },
  {
    id: "winged-foot", name: "Winged Foot Golf Club (West)", location: "Mamaroneck, New York, USA",
    city: "Mamaroneck", region: "New York", country: "USA", holes: 18, par: 72, yardage: 7264,
    status: "open", established: 1923, designer: "A.W. Tillinghast", scorecard: generateScorecard(72, 11),
    validated: true, bluegolfId: "bg-winged-foot",
  },
  {
    id: "cape-kidnappers", name: "Cape Kidnappers Golf Course", location: "Hawke's Bay, New Zealand",
    city: "Hawke's Bay", region: "Hawke's Bay", country: "New Zealand", holes: 18, par: 71, yardage: 7119,
    status: "open", established: 2004, designer: "Tom Doak", scorecard: generateScorecard(71, 12),
    validated: true, bluegolfId: "bg-cape-kidnappers",
  },
  {
    id: "hirono", name: "Hirono Golf Club", location: "Shijimi, Hyogo, Japan",
    city: "Shijimi", region: "Hyogo", country: "Japan", holes: 18, par: 72, yardage: 6925,
    status: "open", established: 1932, designer: "Charles Alison", scorecard: generateScorecard(72, 13),
    validated: true, bluegolfId: "bg-hirono",
  },
  {
    id: "kingston-heath", name: "Kingston Heath Golf Club", location: "Cheltenham, Victoria, Australia",
    city: "Cheltenham", region: "Victoria", country: "Australia", holes: 18, par: 72, yardage: 6852,
    status: "open", established: 1925, designer: "Dan Soutar & Alister MacKenzie", scorecard: generateScorecard(72, 14),
    validated: true, bluegolfId: "bg-kingston-heath",
  },
  {
    id: "musselburgh-links", name: "Musselburgh Old Course", location: "Musselburgh, East Lothian, Scotland",
    city: "Musselburgh", region: "East Lothian", country: "Scotland", holes: 9, par: 34, yardage: 2954,
    status: "open", established: 1672, designer: "Unknown (oldest verified golf course)", scorecard: generate9Scorecard(),
    validated: true, bluegolfId: "bg-musselburgh",
  },
  {
    id: "leith-links", name: "Leith Links", location: "Edinburgh, Scotland",
    city: "Edinburgh", region: "Scotland", country: "Scotland", holes: 5, par: 20, yardage: 1800,
    status: "closed", established: 1554, designer: "Unknown (historic)", scorecard: [],
    validated: false,
  },
  {
    id: "prestwick", name: "Prestwick Golf Club", location: "Prestwick, South Ayrshire, Scotland",
    city: "Prestwick", region: "South Ayrshire", country: "Scotland", holes: 18, par: 71, yardage: 6908,
    status: "open", established: 1851, designer: "Old Tom Morris", scorecard: generateScorecard(71, 15),
    validated: true, bluegolfId: "bg-prestwick",
  },
  {
    id: "riviera", name: "Riviera Country Club", location: "Pacific Palisades, California, USA",
    city: "Pacific Palisades", region: "California", country: "USA", holes: 18, par: 71, yardage: 7322,
    status: "open", established: 1926, designer: "George C. Thomas Jr.", scorecard: generateScorecard(71, 16),
    validated: true, bluegolfId: "bg-riviera",
  },
  {
    id: "valderrama", name: "Real Club Valderrama", location: "Sotogrande, Cádiz, Spain",
    city: "Sotogrande", region: "Cádiz", country: "Spain", holes: 18, par: 71, yardage: 6951,
    status: "open", established: 1974, designer: "Robert Trent Jones Sr.", scorecard: generateScorecard(71, 17),
    validated: true, bluegolfId: "bg-valderrama",
  },
  {
    id: "casa-de-campo", name: "Casa de Campo (Teeth of the Dog)", location: "La Romana, Dominican Republic",
    city: "La Romana", region: "La Romana", country: "Dominican Republic", holes: 18, par: 72, yardage: 7262,
    status: "open", established: 1971, designer: "Pete Dye", scorecard: generateScorecard(72, 18),
    validated: true, bluegolfId: "bg-casa-de-campo",
  },
  // === NEW: 30+ additional niche/local/worldwide courses ===
  {
    id: "bandon-dunes", name: "Bandon Dunes Golf Resort", location: "Bandon, Oregon, USA",
    city: "Bandon", region: "Oregon", country: "USA", holes: 18, par: 72, yardage: 6732,
    status: "open", established: 1999, designer: "David McLay Kidd", scorecard: generateScorecard(72, 19),
    validated: true, bluegolfId: "bg-bandon-dunes",
  },
  {
    id: "pacific-dunes", name: "Pacific Dunes", location: "Bandon, Oregon, USA",
    city: "Bandon", region: "Oregon", country: "USA", holes: 18, par: 71, yardage: 6633,
    status: "open", established: 2001, designer: "Tom Doak", scorecard: generateScorecard(71, 20),
    validated: true, bluegolfId: "bg-pacific-dunes",
  },
  {
    id: "sand-valley", name: "Sand Valley Golf Resort", location: "Nekoosa, Wisconsin, USA",
    city: "Nekoosa", region: "Wisconsin", country: "USA", holes: 18, par: 72, yardage: 6913,
    status: "open", established: 2017, designer: "Bill Coore & Ben Crenshaw", scorecard: generateScorecard(72, 21),
    validated: true, bluegolfId: "bg-sand-valley",
  },
  {
    id: "streamsong-red", name: "Streamsong Red", location: "Bowling Green, Florida, USA",
    city: "Bowling Green", region: "Florida", country: "USA", holes: 18, par: 72, yardage: 7050,
    status: "open", established: 2012, designer: "Bill Coore & Ben Crenshaw", scorecard: generateScorecard(72, 22),
    validated: true, bluegolfId: "bg-streamsong-red",
  },
  {
    id: "streamsong-blue", name: "Streamsong Blue", location: "Bowling Green, Florida, USA",
    city: "Bowling Green", region: "Florida", country: "USA", holes: 18, par: 72, yardage: 7077,
    status: "open", established: 2012, designer: "Tom Doak", scorecard: generateScorecard(72, 23),
    validated: true, bluegolfId: "bg-streamsong-blue",
  },
  {
    id: "bethpage-black", name: "Bethpage Black", location: "Farmingdale, New York, USA",
    city: "Farmingdale", region: "New York", country: "USA", holes: 18, par: 71, yardage: 7468,
    status: "open", established: 1936, designer: "A.W. Tillinghast", scorecard: generateScorecard(71, 24),
    validated: true, bluegolfId: "bg-bethpage-black",
  },
  {
    id: "torrey-pines-south", name: "Torrey Pines (South)", location: "La Jolla, California, USA",
    city: "La Jolla", region: "California", country: "USA", holes: 18, par: 72, yardage: 7698,
    status: "open", established: 1957, designer: "William Bell", scorecard: generateScorecard(72, 25),
    validated: true, bluegolfId: "bg-torrey-south",
  },
  {
    id: "tpc-sawgrass", name: "TPC Sawgrass (Stadium)", location: "Ponte Vedra Beach, Florida, USA",
    city: "Ponte Vedra Beach", region: "Florida", country: "USA", holes: 18, par: 72, yardage: 7245,
    status: "open", established: 1980, designer: "Pete Dye", scorecard: generateScorecard(72, 26),
    validated: true, bluegolfId: "bg-tpc-sawgrass",
  },
  {
    id: "kiawah-ocean", name: "Kiawah Island (Ocean Course)", location: "Kiawah Island, South Carolina, USA",
    city: "Kiawah Island", region: "South Carolina", country: "USA", holes: 18, par: 72, yardage: 7356,
    status: "open", established: 1991, designer: "Pete Dye", scorecard: generateScorecard(72, 27),
    validated: true, bluegolfId: "bg-kiawah-ocean",
  },
  {
    id: "whistling-straits", name: "Whistling Straits (Straits)", location: "Sheboygan, Wisconsin, USA",
    city: "Sheboygan", region: "Wisconsin", country: "USA", holes: 18, par: 72, yardage: 7390,
    status: "open", established: 1998, designer: "Pete Dye", scorecard: generateScorecard(72, 28),
    validated: true, bluegolfId: "bg-whistling-straits",
  },
  {
    id: "harbour-town", name: "Harbour Town Golf Links", location: "Hilton Head Island, South Carolina, USA",
    city: "Hilton Head Island", region: "South Carolina", country: "USA", holes: 18, par: 71, yardage: 7099,
    status: "open", established: 1969, designer: "Pete Dye & Jack Nicklaus", scorecard: generateScorecard(71, 29),
    validated: true, bluegolfId: "bg-harbour-town",
  },
  {
    id: "royal-birkdale", name: "Royal Birkdale Golf Club", location: "Southport, Merseyside, England",
    city: "Southport", region: "Merseyside", country: "England", holes: 18, par: 72, yardage: 7156,
    status: "open", established: 1889, designer: "George Low & F.W. Hawtree", scorecard: generateScorecard(72, 30),
    validated: true, bluegolfId: "bg-royal-birkdale",
  },
  {
    id: "royal-troon", name: "Royal Troon Golf Club", location: "Troon, South Ayrshire, Scotland",
    city: "Troon", region: "South Ayrshire", country: "Scotland", holes: 18, par: 71, yardage: 7190,
    status: "open", established: 1878, designer: "Charles Hunter & James Braid", scorecard: generateScorecard(71, 31),
    validated: true, bluegolfId: "bg-royal-troon",
  },
  {
    id: "royal-st-georges", name: "Royal St George's Golf Club", location: "Sandwich, Kent, England",
    city: "Sandwich", region: "Kent", country: "England", holes: 18, par: 70, yardage: 7204,
    status: "open", established: 1887, designer: "Laidlaw Purves", scorecard: generateScorecard(70, 32),
    validated: true, bluegolfId: "bg-royal-st-georges",
  },
  {
    id: "ballybunion", name: "Ballybunion Golf Club (Old)", location: "Ballybunion, Kerry, Ireland",
    city: "Ballybunion", region: "Kerry", country: "Ireland", holes: 18, par: 71, yardage: 6802,
    status: "open", established: 1893, designer: "Natural Links", scorecard: generateScorecard(71, 33),
    validated: true, bluegolfId: "bg-ballybunion",
  },
  {
    id: "lahinch", name: "Lahinch Golf Club", location: "Lahinch, Clare, Ireland",
    city: "Lahinch", region: "Clare", country: "Ireland", holes: 18, par: 72, yardage: 6950,
    status: "open", established: 1892, designer: "Old Tom Morris & Alister MacKenzie", scorecard: generateScorecard(72, 34),
    validated: true, bluegolfId: "bg-lahinch",
  },
  {
    id: "sunningdale-old", name: "Sunningdale Golf Club (Old)", location: "Sunningdale, Surrey, England",
    city: "Sunningdale", region: "Surrey", country: "England", holes: 18, par: 70, yardage: 6627,
    status: "open", established: 1901, designer: "Willie Park Jr.", scorecard: generateScorecard(70, 35),
    validated: true, bluegolfId: "bg-sunningdale-old",
  },
  {
    id: "cabot-cliffs", name: "Cabot Cliffs", location: "Inverness, Nova Scotia, Canada",
    city: "Inverness", region: "Nova Scotia", country: "Canada", holes: 18, par: 72, yardage: 6764,
    status: "open", established: 2015, designer: "Bill Coore & Ben Crenshaw", scorecard: generateScorecard(72, 36),
    validated: true, bluegolfId: "bg-cabot-cliffs",
  },
  {
    id: "cabot-links", name: "Cabot Links", location: "Inverness, Nova Scotia, Canada",
    city: "Inverness", region: "Nova Scotia", country: "Canada", holes: 18, par: 70, yardage: 6798,
    status: "open", established: 2012, designer: "Rod Whitman", scorecard: generateScorecard(70, 37),
    validated: true, bluegolfId: "bg-cabot-links",
  },
  {
    id: "barnbougle-dunes", name: "Barnbougle Dunes", location: "Bridport, Tasmania, Australia",
    city: "Bridport", region: "Tasmania", country: "Australia", holes: 18, par: 71, yardage: 6616,
    status: "open", established: 2004, designer: "Tom Doak & Mike Clayton", scorecard: generateScorecard(71, 38),
    validated: true, bluegolfId: "bg-barnbougle",
  },
  {
    id: "royal-dornoch", name: "Royal Dornoch Golf Club", location: "Dornoch, Sutherland, Scotland",
    city: "Dornoch", region: "Sutherland", country: "Scotland", holes: 18, par: 70, yardage: 6726,
    status: "open", established: 1877, designer: "Old Tom Morris & John Sutherland", scorecard: generateScorecard(70, 39),
    validated: true, bluegolfId: "bg-royal-dornoch",
  },
  {
    id: "club-waterbury", name: "Country Club of Waterbury", location: "Waterbury, Connecticut, USA",
    city: "Waterbury", region: "Connecticut", country: "USA", holes: 18, par: 71, yardage: 6603,
    status: "open", established: 1920, designer: "Seth Raynor", scorecard: [
      { hole: 1, yards: 424, par: 4 }, { hole: 2, yards: 443, par: 4 }, { hole: 3, yards: 230, par: 3 },
      { hole: 4, yards: 392, par: 4 }, { hole: 5, yards: 476, par: 4 }, { hole: 6, yards: 206, par: 3 },
      { hole: 7, yards: 426, par: 4 }, { hole: 8, yards: 153, par: 3 }, { hole: 9, yards: 516, par: 5 },
      { hole: 10, yards: 407, par: 4 }, { hole: 11, yards: 364, par: 4 }, { hole: 12, yards: 397, par: 4 },
      { hole: 13, yards: 400, par: 4 }, { hole: 14, yards: 237, par: 3 }, { hole: 15, yards: 470, par: 4 },
      { hole: 16, yards: 373, par: 4 }, { hole: 17, yards: 404, par: 4 }, { hole: 18, yards: 449, par: 4 },
    ],
    validated: true, bluegolfId: "bg-waterbury",
  },
  {
    id: "congressional-blue", name: "Congressional Country Club (Blue)", location: "Bethesda, Maryland, USA",
    city: "Bethesda", region: "Maryland", country: "USA", holes: 18, par: 72, yardage: 7580,
    status: "open", established: 1924, designer: "Devereux Emmet & Rees Jones", scorecard: generateScorecard(72, 40),
    validated: true, bluegolfId: "bg-congressional",
  },
  {
    id: "east-lake", name: "East Lake Golf Club", location: "Atlanta, Georgia, USA",
    city: "Atlanta", region: "Georgia", country: "USA", holes: 18, par: 72, yardage: 7346,
    status: "open", established: 1904, designer: "Tom Bendelow & Rees Jones", scorecard: generateScorecard(72, 41),
    validated: true, bluegolfId: "bg-east-lake",
  },
  {
    id: "prairie-dunes", name: "Prairie Dunes Country Club", location: "Hutchinson, Kansas, USA",
    city: "Hutchinson", region: "Kansas", country: "USA", holes: 18, par: 70, yardage: 6674,
    status: "open", established: 1937, designer: "Perry Maxwell", scorecard: generateScorecard(70, 42),
    validated: true, bluegolfId: "bg-prairie-dunes",
  },
  {
    id: "seminole", name: "Seminole Golf Club", location: "Juno Beach, Florida, USA",
    city: "Juno Beach", region: "Florida", country: "USA", holes: 18, par: 72, yardage: 7102,
    status: "open", established: 1929, designer: "Donald Ross", scorecard: generateScorecard(72, 43),
    validated: true, bluegolfId: "bg-seminole",
  },
  {
    id: "los-angeles-north", name: "Los Angeles Country Club (North)", location: "Los Angeles, California, USA",
    city: "Los Angeles", region: "California", country: "USA", holes: 18, par: 71, yardage: 7350,
    status: "open", established: 1921, designer: "George C. Thomas Jr.", scorecard: generateScorecard(71, 44),
    validated: true, bluegolfId: "bg-lacc-north",
  },
  {
    id: "national-golf-links", name: "National Golf Links of America", location: "Southampton, New York, USA",
    city: "Southampton", region: "New York", country: "USA", holes: 18, par: 73, yardage: 6880,
    status: "open", established: 1911, designer: "Charles Blair Macdonald", scorecard: generateScorecard(73, 45),
    validated: true, bluegolfId: "bg-national-golf-links",
  },
  {
    id: "garden-city", name: "Garden City Golf Club", location: "Garden City, New York, USA",
    city: "Garden City", region: "New York", country: "USA", holes: 18, par: 73, yardage: 6940,
    status: "open", established: 1899, designer: "Devereux Emmet & Walter Travis", scorecard: generateScorecard(73, 46),
    validated: true, bluegolfId: "bg-garden-city",
  },
  {
    id: "royal-aberdeen", name: "Royal Aberdeen Golf Club", location: "Aberdeen, Aberdeenshire, Scotland",
    city: "Aberdeen", region: "Aberdeenshire", country: "Scotland", holes: 18, par: 71, yardage: 6886,
    status: "open", established: 1780, designer: "Robert Simpson & James Braid", scorecard: generateScorecard(71, 47),
    validated: true, bluegolfId: "bg-royal-aberdeen",
  },
  {
    id: "royal-lytham", name: "Royal Lytham & St Annes", location: "Lytham St Annes, Lancashire, England",
    city: "Lytham St Annes", region: "Lancashire", country: "England", holes: 18, par: 71, yardage: 6905,
    status: "open", established: 1886, designer: "Harry Colt", scorecard: generateScorecard(71, 48),
    validated: true, bluegolfId: "bg-royal-lytham",
  },
  {
    id: "wolf-creek", name: "Wolf Creek Golf Club", location: "Mesquite, Nevada, USA",
    city: "Mesquite", region: "Nevada", country: "USA", holes: 18, par: 72, yardage: 6939,
    status: "open", established: 2000, designer: "Dennis Rider", scorecard: generateScorecard(72, 49),
    validated: true, bluegolfId: "bg-wolf-creek",
  },
  {
    id: "pinehurst-no4", name: "Pinehurst No. 4", location: "Pinehurst, North Carolina, USA",
    city: "Pinehurst", region: "North Carolina", country: "USA", holes: 18, par: 72, yardage: 7300,
    status: "open", established: 1919, designer: "Gil Hanse", scorecard: generateScorecard(72, 50),
    validated: true, bluegolfId: "bg-pinehurst-no4",
  },
  {
    id: "erin-hills", name: "Erin Hills", location: "Erin, Wisconsin, USA",
    city: "Erin", region: "Wisconsin", country: "USA", holes: 18, par: 72, yardage: 7741,
    status: "open", established: 2006, designer: "Michael Hurdzan, Dana Fry & Ron Whitten", scorecard: generateScorecard(72, 51),
    validated: true, bluegolfId: "bg-erin-hills",
  },
  {
    id: "kapalua-plantation", name: "Kapalua Plantation Course", location: "Lahaina, Maui, USA",
    city: "Lahaina", region: "Maui", country: "USA", holes: 18, par: 73, yardage: 7596,
    status: "open", established: 1991, designer: "Bill Coore & Ben Crenshaw", scorecard: generateScorecard(73, 52),
    validated: true, bluegolfId: "bg-kapalua-plantation",
  },
];

export const POSTER_COURSES = [
  { id: "augusta-national", label: "Augusta National" },
  { id: "pebble-beach", label: "Pebble Beach" },
  { id: "st-andrews", label: "St Andrews" },
  { id: "pinehurst-no2", label: "Pinehurst No. 2" },
];