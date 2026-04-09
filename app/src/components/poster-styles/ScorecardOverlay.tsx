import { HoleScore } from "@/data/rounds";

interface ScorecardTheme {
  bgFill: string;
  borderStroke: string;
  borderWidth: number;
  borderRadius: number;
  borderOpacity?: number;
  headerColor: string;
  labelColor: string;
  valueColor: string;
  dividerStroke: string;
  dividerOpacity?: number;
  fontFamily: string;
}

interface ScorecardOverlayProps {
  front9: { hole: number; yards: number; par: number }[];
  back9: { hole: number; yards: number; par: number }[];
  par: number;
  yardage: number;
  established: number;
  designer: string;
  theme: ScorecardTheme;
  userScores?: HoleScore[] | null;
  showScore?: boolean;
}

const getScoreColor = (strokes: number, par: number): string => {
  const diff = strokes - par;
  if (diff <= -2) return "hsl(42, 80%, 55%)";   // eagle — gold
  if (diff === -1) return "hsl(145, 60%, 45%)";  // birdie — green
  if (diff === 0) return "";                       // par — use default
  if (diff === 1) return "hsl(0, 55%, 58%)";      // bogey — soft red
  return "hsl(0, 65%, 48%)";                       // double+ — red
};

const ScorecardOverlay = ({ front9, back9, par, yardage, established, designer, theme, userScores, showScore = false }: ScorecardOverlayProps) => {
  const hasScores = showScore && !!userScores && userScores.length > 0;
  const getScore = (hole: number) => userScores?.find((s) => s.hole === hole)?.strokes ?? 0;

  // Layout shifts when user scores are present
  const h = hasScores ? 105 : 90;

  // Y positions for front 9
  const fHole = 20, fYds = 27, fPar = 34;
  const fScore = 41;
  const fDiv = hasScores ? 45 : 38;

  // Y positions for back 9
  const bHole = hasScores ? 53 : 46;
  const bYds = hasScores ? 60 : 53;
  const bPar = hasScores ? 67 : 60;
  const bScore = 74;
  const bDiv = hasScores ? 78 : 64;

  // Summary
  const sumY = hasScores ? 88 : 74;
  const estY = hasScores ? 97 : 83;

  const frontTotal = hasScores ? front9.reduce((s, hole) => s + getScore(hole.hole), 0) : 0;
  const backTotal = hasScores ? back9.reduce((s, hole) => s + getScore(hole.hole), 0) : 0;
  const totalScore = frontTotal + backTotal;

  return (
    <g transform="translate(255, 15)" fontSize="5" fontFamily={theme.fontFamily}>
      <rect
        width="130"
        height={h}
        rx={theme.borderRadius}
        fill={theme.bgFill}
        stroke={theme.borderStroke}
        strokeWidth={theme.borderWidth}
        opacity={theme.borderOpacity ?? 0.9}
      />
      <text x="65" y="10" textAnchor="middle" fontWeight="600" fontSize="5.5" fill={theme.headerColor}>SCORECARD</text>

      {/* Front 9 — labels */}
      <text x="5" y={fHole} fontWeight="600" fill={theme.labelColor}>Hole</text>
      <text x="5" y={fYds} fontWeight="600" fill={theme.labelColor}>Yds</text>
      <text x="5" y={fPar} fontWeight="600" fill={theme.labelColor}>Par</text>
      {hasScores && <text x="5" y={fScore} fontWeight="700" fill={theme.headerColor}>Score</text>}

      {/* Front 9 — values */}
      {front9.map((hole, i) => {
        const score = getScore(hole.hole);
        const scoreColor = score > 0 ? (getScoreColor(score, hole.par) || theme.valueColor) : theme.valueColor;
        return (
          <g key={`f${i}`}>
            <text x={22 + i * 12} y={fHole} textAnchor="middle" fill={theme.valueColor}>{hole.hole}</text>
            <text x={22 + i * 12} y={fYds} textAnchor="middle" fill={theme.valueColor} fontSize="4">{hole.yards}</text>
            <text x={22 + i * 12} y={fPar} textAnchor="middle" fill={theme.valueColor}>{hole.par}</text>
            {hasScores && (
              <text x={22 + i * 12} y={fScore} textAnchor="middle" fill={scoreColor} fontWeight="700">
                {score > 0 ? score : "·"}
              </text>
            )}
          </g>
        );
      })}

      {/* Front 9 total */}
      {hasScores && frontTotal > 0 && (
        <text x="125" y={fScore} textAnchor="middle" fill={theme.headerColor} fontWeight="700" fontSize="4.5">
          {frontTotal}
        </text>
      )}

      <line x1="2" y1={fDiv} x2="128" y2={fDiv} stroke={theme.dividerStroke} strokeWidth={hasScores ? 0.3 : 0.3} opacity={theme.dividerOpacity ?? 1} />

      {/* Back 9 — labels */}
      <text x="5" y={bHole} fontWeight="600" fill={theme.labelColor}>Hole</text>
      <text x="5" y={bYds} fontWeight="600" fill={theme.labelColor}>Yds</text>
      <text x="5" y={bPar} fontWeight="600" fill={theme.labelColor}>Par</text>
      {hasScores && <text x="5" y={bScore} fontWeight="700" fill={theme.headerColor}>Score</text>}

      {/* Back 9 — values */}
      {back9.map((hole, i) => {
        const score = getScore(hole.hole);
        const scoreColor = score > 0 ? (getScoreColor(score, hole.par) || theme.valueColor) : theme.valueColor;
        return (
          <g key={`b${i}`}>
            <text x={22 + i * 12} y={bHole} textAnchor="middle" fill={theme.valueColor}>{hole.hole}</text>
            <text x={22 + i * 12} y={bYds} textAnchor="middle" fill={theme.valueColor} fontSize="4">{hole.yards}</text>
            <text x={22 + i * 12} y={bPar} textAnchor="middle" fill={theme.valueColor}>{hole.par}</text>
            {hasScores && (
              <text x={22 + i * 12} y={bScore} textAnchor="middle" fill={scoreColor} fontWeight="700">
                {score > 0 ? score : "·"}
              </text>
            )}
          </g>
        );
      })}

      {/* Back 9 total */}
      {hasScores && backTotal > 0 && (
        <text x="125" y={bScore} textAnchor="middle" fill={theme.headerColor} fontWeight="700" fontSize="4.5">
          {backTotal}
        </text>
      )}

      <line x1="2" y1={bDiv} x2="128" y2={bDiv} stroke={theme.dividerStroke} strokeWidth={0.2} opacity={theme.dividerOpacity ?? 1} />

      {/* Summary */}
      <text x="65" y={sumY} textAnchor="middle" fontWeight="600" fontSize="5" fill={theme.headerColor}>
        {hasScores && totalScore > 0
          ? `Score ${totalScore} · Par ${par}`
          : `Par ${par} · ${yardage.toLocaleString()} yards`}
      </text>
      <text x="65" y={estY} textAnchor="middle" fontSize="4" fill={theme.valueColor}>
        Est. {established} · {designer.split(" & ")[0].split(",")[0]}
      </text>
    </g>
  );
};

export default ScorecardOverlay;
