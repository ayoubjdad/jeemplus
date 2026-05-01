import { useMemo, useState } from "react";
import styles from "./WorldCupCupTree.module.scss";

/** Must stay in sync with `.match` min-height + gaps in SCSS */
const CARD_H = 102;
const CARD_GAP_R0 = 10;
const COL_WIDTH = 204;
const COL_GUTTER = 32;
/** Extra top space for optional round labels above columns */
const PAD_TOP = 36;
const PAD_LEFT = 12;
const THIRD_BELOW_FINAL = 18;

const ROUND_DESCRIPTION_FR = {
  "Round of 32": "Seizièmes de finale",
  "Round of 16": "Huitièmes de finale",
  Quarterfinal: "Quarts de finale",
  Semifinal: "Demi-finales",
  Final: "Finale",
};

function roundLabel(description) {
  if (!description) return "Tour";
  return ROUND_DESCRIPTION_FR[description] || description;
}

function sortBlocks(blocks) {
  return [...(blocks || [])].sort(
    (a, b) => (a?.order ?? 0) - (b?.order ?? 0),
  );
}

function sortParticipants(participants) {
  return [...(participants || [])].sort(
    (a, b) => (a?.order ?? 0) - (b?.order ?? 0),
  );
}

function formatMatchDate(timestampSec) {
  if (timestampSec == null || Number.isNaN(timestampSec)) return null;
  const d = new Date(timestampSec * 1000);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(d)
    .replace(",", "");
}

function ShieldIcon() {
  return (
    <svg
      className={styles.shieldIcon}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M12 2 4 5.2V12c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V5.2L12 2zm0 2.2 6 2.5V19c-2.8-1-5-3.7-5-7V7.2l5-2.1z"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      className={styles.trophyIcon}
      width={36}
      height={36}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M5 4h2v2h10V4h2v2h2v2c0 2.2-1.5 4-3.5 4.3.3.9.5 1.9.5 3H7c0-1.1.2-2.1.5-3C5.5 10.2 4 8.4 4 6V6H5V4zm2.2 8h9.6c.2-.6.2-1.3.2-2H7c0 .7 0 1.4.2 2zM7 14h10v2H7v-2zm-2 4h14v2H5v-2z"
      />
    </svg>
  );
}

function TeamSlot({ participant }) {
  const team = participant?.team;
  const winner = Boolean(participant?.winner);
  if (!team) {
    return (
      <div className={styles.slot}>
        <ShieldIcon />
        <span className={styles.slotName}>—</span>
      </div>
    );
  }

  const useLogo = team.national === true && team.disabled !== true;

  return (
    <div
      className={`${styles.slot} ${winner ? styles.slotWinner : ""} ${
        team.disabled ? styles.slotPlaceholder : ""
      }`}
    >
      {useLogo ? (
        <img
          className={styles.slotLogo}
          src={`https://img.sofascore.com/api/v1/team/${team.id}/image`}
          alt=""
          width={22}
          height={22}
        />
      ) : (
        <ShieldIcon />
      )}
      <span className={styles.slotName}>{team.shortName || team.name}</span>
    </div>
  );
}

/**
 * @param {number} x1 - outer column right edge / merge start side
 * @param {number} x2 - inner column left edge
 */
function mergePathD(x1, x2, y0, y1, yOut) {
  const xm = (x1 + x2) / 2;
  const lo = Math.min(y0, y1);
  const hi = Math.max(y0, y1);
  const vTop = Math.min(lo, yOut);
  const vBot = Math.max(hi, yOut);
  return [
    `M ${x1} ${y0} L ${xm} ${y0}`,
    `M ${x1} ${y1} L ${xm} ${y1}`,
    `M ${xm} ${vTop} L ${xm} ${vBot}`,
    `M ${xm} ${yOut} L ${x2} ${yOut}`,
  ].join(" ");
}

/** Left edge X of bracket column idx (mirror inverts outward columns). */
function colLeftX(roundCount, mirror, idx) {
  if (!mirror) {
    return PAD_LEFT + idx * (COL_WIDTH + COL_GUTTER);
  }
  return PAD_LEFT + (roundCount - 1 - idx) * (COL_WIDTH + COL_GUTTER);
}

function computeCenters(roundsPrepared) {
  const n = roundsPrepared.length;
  const centers = [];

  for (let r = 0; r < n; r += 1) {
    const count = roundsPrepared[r].blocks.length;
    centers[r] = [];

    const prev = centers[r - 1];
    const prevCount = roundsPrepared[r - 1]?.blocks?.length ?? 0;
    const isDualFinal =
      roundsPrepared[r].description === "Final" && count === 2;

    if (r === 0) {
      for (let i = 0; i < count; i += 1) {
        centers[r][i] = PAD_TOP + i * (CARD_H + CARD_GAP_R0) + CARD_H / 2;
      }
    } else if (isDualFinal && prevCount === 2) {
      const yF = (prev[0] + prev[1]) / 2;
      centers[r][0] = yF;
      centers[r][1] = yF + CARD_H / 2 + THIRD_BELOW_FINAL + CARD_H / 2;
    } else {
      for (let i = 0; i < count; i += 1) {
        const yTop = prev[2 * i];
        const yBot = prev[2 * i + 1];
        if (yBot == null) {
          centers[r][i] = yTop;
        } else {
          centers[r][i] = (yTop + yBot) / 2;
        }
      }
    }
  }

  return centers;
}

function buildConnectorPaths(roundsPrepared, centers, mirror) {
  const paths = [];
  const numRounds = roundsPrepared.length;
  const Nc = numRounds;

  for (let r = 0; r < numRounds - 1; r += 1) {
    const xOuterRight = colLeftX(Nc, mirror, r) + COL_WIDTH;
    const xInnerLeft = colLeftX(Nc, mirror, r + 1);

    const nextRound = roundsPrepared[r + 1];
    const currCenters = centers[r];
    const nextCenters = centers[r + 1];
    const nextCount = nextRound.blocks.length;
    const isDualFinal =
      nextRound.description === "Final" && nextCount === 2;

    if (isDualFinal && currCenters.length === 2) {
      const y0 = currCenters[0];
      const y1 = currCenters[1];
      const yFinal = nextCenters[0];
      const yThird = nextCenters[1];
      paths.push({
        key: `${r}-f`,
        d: mergePathD(xOuterRight, xInnerLeft, y0, y1, yFinal),
      });
      paths.push({
        key: `${r}-3`,
        d: mergePathD(xOuterRight, xInnerLeft, y0, y1, yThird),
      });
    } else {
      const pairCount =
        currCenters.length % 2 === 0 ? currCenters.length / 2 : 0;
      for (let i = 0; i < pairCount; i += 1) {
        const yTop = currCenters[2 * i];
        const yBot = currCenters[2 * i + 1];
        const yOut = nextCenters[i];
        paths.push({
          key: `${r}-${i}`,
          d: mergePathD(xOuterRight, xInnerLeft, yTop, yBot, yOut),
        });
      }
    }
  }

  return paths;
}

function layoutWidthForRounds(numCols) {
  if (numCols <= 0) return PAD_LEFT * 2;
  return (
    PAD_LEFT * 2 + numCols * COL_WIDTH + Math.max(0, numCols - 1) * COL_GUTTER
  );
}

/** Full layout incl. Finale (single wide bracket). */
function buildFullBracketLayout(roundsPrepared) {
  const centers = computeCenters(roundsPrepared);
  const lastIdx = roundsPrepared.length - 1;

  let maxBottom = 0;
  for (let r = 0; r < roundsPrepared.length; r += 1) {
    const n = roundsPrepared[r].blocks.length;
    for (let i = 0; i < n; i += 1) {
      const c = centers[r][i];
      maxBottom = Math.max(maxBottom, c + CARD_H / 2);
    }
  }

  const layoutHeight = maxBottom + PAD_TOP + 24;
  const layoutWidth = layoutWidthForRounds(roundsPrepared.length);

  const paths = buildConnectorPaths(roundsPrepared, centers, false);

  const finalRound = roundsPrepared[lastIdx];
  const finalIsDual =
    finalRound.description === "Final" && finalRound.blocks.length >= 2;
  const trophyY =
    finalIsDual && centers[lastIdx]?.[0] != null
      ? centers[lastIdx][0] - CARD_H / 2 + 12
      : null;
  const trophyX = layoutWidth - 52;

  return {
    roundsPrepared,
    centers,
    layoutHeight,
    layoutWidth,
    paths,
    trophyY,
    trophyX,
  };
}

/** Half subtree (sans finale) avec connecteurs jusqu’aux demies. */
function buildHalfBracketLayout(roundsSubset, mirror) {
  const numCols = roundsSubset.length;
  const centers = computeCenters(roundsSubset);

  let maxBottom = 0;
  for (let r = 0; r < roundsSubset.length; r += 1) {
    const n = roundsSubset[r].blocks.length;
    for (let i = 0; i < n; i += 1) {
      const c = centers[r][i];
      maxBottom = Math.max(maxBottom, c + CARD_H / 2);
    }
  }

  const layoutHeight = maxBottom + PAD_TOP + 24;
  const layoutWidth = layoutWidthForRounds(numCols);

  const paths = buildConnectorPaths(roundsSubset, centers, mirror);

  return {
    roundsPrepared: roundsSubset,
    centers,
    layoutHeight,
    layoutWidth,
    paths,
  };
}

function prepareRoundsSorted(tree) {
  const roundsRaw = [...(tree?.rounds || [])].sort(
    (a, b) => (a?.order ?? 0) - (b?.order ?? 0),
  );

  return roundsRaw.map((round) => ({
    ...round,
    blocks: sortBlocks(round.blocks),
    description: round.description,
    id: round.id,
    order: round.order,
  }));
}

/** Garde tableau complet si structure inattendue. */
function canSplitKnockoutBracket(roundsPrepared) {
  if (roundsPrepared.length < 3) return false;
  const last = roundsPrepared[roundsPrepared.length - 1];
  if (last.description !== "Final") return false;
  const prelim = roundsPrepared.slice(0, -1);
  if (prelim.length < 1) return false;

  const sf = prelim[prelim.length - 1];
  if ((sf.blocks?.length ?? 0) !== 2) return false;

  for (let i = 0; i < prelim.length - 1; i += 1) {
    const n = prelim[i].blocks?.length ?? 0;
    if (n < 2 || n % 2 !== 0) return false;
  }
  const n0 = prelim[0].blocks?.length ?? 0;
  return n0 >= 4 && n0 % 2 === 0;
}

function slicePreliminaryHalves(preliminaryRounds) {
  const lastPreIdx = preliminaryRounds.length - 1;

  const left = preliminaryRounds.map((round, i) => {
    const bs = round.blocks;
    const n = bs.length;
    if (i === lastPreIdx) {
      return { ...round, blocks: bs.slice(0, 1) };
    }
    const half = Math.floor(n / 2);
    return { ...round, blocks: bs.slice(0, half) };
  });

  const right = preliminaryRounds.map((round, i) => {
    const bs = round.blocks;
    const n = bs.length;
    if (i === lastPreIdx) {
      return { ...round, blocks: bs.slice(1, 2) };
    }
    const half = Math.floor(n / 2);
    return { ...round, blocks: bs.slice(half, n) };
  });

  return { left, right };
}

function MatchBlock({ block, badge }) {
  const parts = sortParticipants(block?.participants);
  const meta = formatMatchDate(block?.seriesStartDateTimestamp);

  return (
    <div
      className={`${styles.match} ${block?.finished ? styles.matchFinished : ""}`}
    >
      {meta ? <div className={styles.matchDate}>{meta}</div> : null}
      <div className={styles.matchBody}>
        <TeamSlot participant={parts[0]} />
        <TeamSlot participant={parts[1]} />
      </div>
      {badge ? (
        <div className={styles.matchFoot}>
          <span className={badge.className}>{badge.text}</span>
        </div>
      ) : null}
    </div>
  );
}

function BracketCanvas({
  layout,
  mirror,
  showTrophy,
  trophyX,
  trophyY,
}) {
  const {
    roundsPrepared,
    centers,
    layoutHeight,
    layoutWidth,
    paths,
  } = layout;
  const Nc = roundsPrepared.length;

  return (
    <div
      className={styles.bracketCanvas}
      style={{
        height: layoutHeight,
        width: layoutWidth,
      }}
    >
      <svg
        className={styles.connectorLayer}
        width={layoutWidth}
        height={layoutHeight}
        aria-hidden
      >
        {paths.map((p) => (
          <path
            key={p.key}
            d={p.d}
            fill="none"
            stroke="rgba(200,210,218,0.35)"
            strokeWidth={1.25}
            strokeLinejoin="miter"
          />
        ))}
      </svg>

      {showTrophy && trophyY != null ? (
        <div
          className={styles.trophyWrap}
          style={{ left: trophyX, top: trophyY }}
        >
          <TrophyIcon />
        </div>
      ) : null}

      {roundsPrepared.map((round, rIdx) => (
        <div
          key={round.id ?? round.order}
          className={styles.bracketColumn}
          style={{
            left: colLeftX(Nc, mirror, rIdx),
            width: COL_WIDTH,
          }}
        >
          <span className={styles.columnRoundLabel}>
            {roundLabel(round.description)}
          </span>
          {(round.blocks || []).map((block, i) => {
            const cy = centers[rIdx]?.[i];
            if (cy == null) return null;

            const isFinalRound = round.description === "Final";
            let badge = null;

            if (isFinalRound && round.blocks.length === 2) {
              if ((block.order ?? i + 1) === 1) {
                badge = { text: "Finale", className: styles.badgeFinal };
              } else {
                badge = { text: "3e place", className: styles.badgeThird };
              }
            } else if (isFinalRound && round.blocks.length === 1) {
              badge = { text: "Finale", className: styles.badgeFinal };
            }

            return (
              <div
                key={block.id ?? block.blockId ?? `${rIdx}-${i}`}
                className={styles.cardSlot}
                style={{
                  top: cy - CARD_H / 2,
                }}
              >
                <MatchBlock block={block} badge={badge} />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function FinalsStack({ finalRound }) {
  const blocks = sortBlocks(finalRound?.blocks);
  if (!blocks.length) return null;

  return (
    <div className={styles.finaleStack}>
      <div className={styles.finaleCardsCol}>
        {blocks.map((block, i) => {
          let badge = null;
          if (blocks.length === 2) {
            if ((block.order ?? i + 1) === 1) {
              badge = { text: "Finale", className: styles.badgeFinal };
            } else {
              badge = { text: "3e place", className: styles.badgeThird };
            }
          } else {
            badge = { text: "Finale", className: styles.badgeFinal };
          }

          return (
            <div
              key={block.id ?? block.blockId ?? i}
              className={styles.finaleCard}
            >
              <MatchBlock block={block} badge={badge} />
            </div>
          );
        })}
      </div>
      <div className={styles.finaleTrophy}>
        <TrophyIcon />
      </div>
    </div>
  );
}

function useBracketModel(tree) {
  return useMemo(() => {
    const roundsPrepared = prepareRoundsSorted(tree);
    if (!roundsPrepared.length) {
      return { mode: "empty" };
    }

    if (!canSplitKnockoutBracket(roundsPrepared)) {
      const full = buildFullBracketLayout(roundsPrepared);
      return { mode: "single", full };
    }

    const finalRound = roundsPrepared[roundsPrepared.length - 1];
    const preliminary = roundsPrepared.slice(0, -1);
    const { left, right } = slicePreliminaryHalves(preliminary);

    const leftLayout = buildHalfBracketLayout(left, false);
    const rightLayout = buildHalfBracketLayout(right, true);

    const maxH = Math.max(leftLayout.layoutHeight, rightLayout.layoutHeight);

    return {
      mode: "split",
      leftLayout: { ...leftLayout, layoutHeight: maxH },
      rightLayout: { ...rightLayout, layoutHeight: maxH },
      finalRound,
    };
  }, [tree]);
}

function CupTreeSingle({ tree }) {
  const model = useBracketModel(tree);

  const treeTitle =
    tree?.tournament?.fieldTranslations?.nameTranslation?.fr ||
    tree?.name ||
    "Phase à élimination";

  if (model.mode === "empty") {
    return (
      <section className={styles.treeSection}>
        <h3 className={styles.treeName}>{treeTitle}</h3>
        <div className={styles.state}>Données de tableau invalides.</div>
      </section>
    );
  }

  if (model.mode === "single") {
    const { full } = model;
    return (
      <section className={styles.treeSection}>
        <h3 className={styles.treeVisuallyHidden}>{treeTitle}</h3>
        <BracketCanvas
          layout={full}
          mirror={false}
          showTrophy
          trophyX={full.trophyX}
          trophyY={full.trophyY}
        />
      </section>
    );
  }

  const { leftLayout, rightLayout, finalRound } = model;

  return (
    <section className={styles.treeSection}>
      <h3 className={styles.treeVisuallyHidden}>{treeTitle}</h3>
      <div className={styles.twoSides}>
        <div className={styles.sidePane}>
          <BracketCanvas
            layout={leftLayout}
            mirror={false}
            showTrophy={false}
          />
        </div>
        <div className={styles.sideGutter} aria-hidden />
        <div className={styles.sidePane}>
          <BracketCanvas
            layout={rightLayout}
            mirror
            showTrophy={false}
          />
        </div>
      </div>
      <div className={styles.finaleRow}>
        <FinalsStack finalRound={finalRound} />
      </div>
    </section>
  );
}

export default function WorldCupCupTree({ trees, loading, error }) {
  const [zoom, setZoom] = useState(1);

  if (loading) {
    return <div className={styles.state}>Chargement du tableau…</div>;
  }

  if (error) {
    return (
      <div className={styles.state}>
        Impossible de charger le tableau. Réessayez plus tard.
      </div>
    );
  }

  if (!trees?.length) {
    return (
      <div className={styles.state}>Aucun tableau disponible pour le moment.</div>
    );
  }

  const zoomIn = () =>
    setZoom((z) => Math.min(1.75, Math.round((z + 0.12) * 100) / 100));
  const zoomOut = () =>
    setZoom((z) => Math.max(0.55, Math.round((z - 0.12) * 100) / 100));

  return (
    <div className={styles.cupRoot}>
      <div className={styles.bracketToolbar}>
        <div className={styles.zoomCluster}>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={zoomIn}
            aria-label="Zoom avant"
          >
            +
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={zoomOut}
            aria-label="Zoom arrière"
          >
            −
          </button>
        </div>
      </div>

      <div className={styles.bracketScroll} style={{ zoom }}>
        {trees.map((t) => (
          <CupTreeSingle key={t.id ?? t.name} tree={t} />
        ))}
      </div>
    </div>
  );
}
