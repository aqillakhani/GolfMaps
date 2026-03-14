export interface HoleScore {
  hole: number;
  strokes: number;
  putts?: number;
}

export interface Round {
  id: string;
  courseId: string;
  datePlayed: string; // ISO date string
  score: number | null;
  notes: string;
  scorecardImage: string | null; // URL/path to uploaded scorecard
  holeScores: HoleScore[] | null;
  createdAt: number;
}

export interface GiftConfig {
  recipientName: string;
  recipientEmail: string;
  personalMessage: string;
  fromName: string;
  giftDeliveryType: "digital" | "canvas";
  recipientAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export interface RoundStats {
  totalRounds: number;
  coursesMapped: number;
  countriesPlayed: string[];
  statesPlayed: string[];
}

// Mock rounds for demo
export const MOCK_ROUNDS: Round[] = [
  {
    id: "round-1",
    courseId: "augusta-national",
    datePlayed: "2025-04-12",
    score: 82,
    notes: "Bucket list dream come true. Amen Corner was breathtaking.",
    scorecardImage: null,
    holeScores: [
      { hole: 1, strokes: 5 }, { hole: 2, strokes: 5 }, { hole: 3, strokes: 4 },
      { hole: 4, strokes: 3 }, { hole: 5, strokes: 5 }, { hole: 6, strokes: 3 },
      { hole: 7, strokes: 5 }, { hole: 8, strokes: 5 }, { hole: 9, strokes: 4 },
      { hole: 10, strokes: 5 }, { hole: 11, strokes: 5 }, { hole: 12, strokes: 3 },
      { hole: 13, strokes: 5 }, { hole: 14, strokes: 4 }, { hole: 15, strokes: 5 },
      { hole: 16, strokes: 3 }, { hole: 17, strokes: 5 }, { hole: 18, strokes: 3 },
    ],
    createdAt: Date.now() - 86400000 * 30,
  },
  {
    id: "round-2",
    courseId: "pebble-beach",
    datePlayed: "2025-06-08",
    score: 88,
    notes: "Ocean views on every hole. Wind picked up on the back nine.",
    scorecardImage: null,
    holeScores: null,
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: "round-3",
    courseId: "st-andrews",
    datePlayed: "2025-09-21",
    score: 91,
    notes: "Played the Old Course at dawn. The Swilcan Bridge moment was unforgettable.",
    scorecardImage: null,
    holeScores: null,
    createdAt: Date.now() - 86400000 * 3,
  },
];
