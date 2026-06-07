import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import styles from "./InteractiveScreen.module.scss";
import { fetchBotolaStandingsTables } from "../../api/botolaStandings";
import { fetchTeamPlayersRoster } from "./teamPlayersApi";
import {
  fallbackPlayerPhoto,
  playerPhoto,
} from "../../helpers/media.helpers";
import { translatePlayerPosition } from "../../helpers/translatePosition";

/** Tracage FIFA — terrain 105 m × 68 m (viewBox métrique). */
function PitchMarkingsSvg({ className }) {
  const W = 105;
  const H = 68;
  const cy = H / 2;
  const penTop = (H - 40.32) / 2;
  const goalTop = (H - 18.32) / 2;
  const penFrontL = 16.5;
  const penFrontR = W - 16.5;
  const arcDy = Math.sqrt(9.15 ** 2 - (16.5 - 11) ** 2);
  const arcTop = cy - arcDy;
  const arcBot = cy + arcDy;
  const line = "rgba(255,255,255,0.42)";
  const sw = 0.16;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <rect
        x="0"
        y="0"
        width={W}
        height={H}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <line
        x1={W / 2}
        y1="0"
        x2={W / 2}
        y2={H}
        stroke={line}
        strokeWidth={sw}
      />
      <circle
        cx={W / 2}
        cy={cy}
        r={9.15}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <circle cx={W / 2} cy={cy} r={0.35} fill={line} stroke="none" />

      <rect
        x="0"
        y={penTop}
        width={16.5}
        height={40.32}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <rect
        x="0"
        y={goalTop}
        width={5.5}
        height={18.32}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <circle cx={11} cy={cy} r={0.35} fill={line} stroke="none" />
      <path
        d={`M ${penFrontL} ${arcTop} A 9.15 9.15 0 0 1 ${penFrontL} ${arcBot}`}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />

      <rect
        x={penFrontR}
        y={penTop}
        width={16.5}
        height={40.32}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <rect
        x={W - 5.5}
        y={goalTop}
        width={5.5}
        height={18.32}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <circle cx={W - 11} cy={cy} r={0.35} fill={line} stroke="none" />
      <path
        d={`M ${penFrontR} ${arcTop} A 9.15 9.15 0 0 1 ${penFrontR} ${arcBot}`}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />

      <path
        d="M 1 0 A 1 1 0 0 0 0 1"
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <path
        d={`M ${W - 1} 0 A 1 1 0 0 1 ${W} 1`}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <path
        d={`M 0 ${H - 1} A 1 1 0 0 0 1 ${H}`}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <path
        d={`M ${W} ${H - 1} A 1 1 0 0 1 ${W - 1} ${H}`}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />

      <rect
        x={-1.5}
        y={cy - 3.66}
        width={1.5}
        height={7.32}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
      <rect
        x={W}
        y={cy - 3.66}
        width={1.5}
        height={7.32}
        fill="none"
        stroke={line}
        strokeWidth={sw}
      />
    </svg>
  );
}

function pctFromCenterPx(cx, cy, rect) {
  const x = ((cx - rect.left) / rect.width) * 100;
  const y = ((cy - rect.top) / rect.height) * 100;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
}

function pointInRect(clientX, clientY, r) {
  if (!r) return false;
  return (
    clientX >= r.left &&
    clientX <= r.right &&
    clientY >= r.top &&
    clientY <= r.bottom
  );
}

/**
 * Source du sélecteur d’équipe (liste `{ team }` comme lignes standings).
 * `null` = charger le classement Botola comme aujourd’hui.
 *
 * @typedef {{ rows: unknown[], isLoading: boolean, isError: boolean }} StandingsPickerSource
 */

/**
 * @param {{
 *   teamId?: number | string,
 *   standingsPicker?: StandingsPickerSource | null,
 *   teamPickerLabel?: string,
 *   selectId?: string,
 *   embedded?: boolean,
 * }} props
 */
export default function InteractiveScreen({
  teamId: initialTeamId = null,
  standingsPicker: standingsPickerExternal = null,
  teamPickerLabel: teamPickerLabelProp = null,
  selectId = "interactive-botola-team",
  embedded = false,
}) {
  const { t, i18n } = useTranslation();
  const teamPickerLabel =
    teamPickerLabelProp ?? t("interactive.teamPickerLabel");
  const mainRef = useRef(null);
  const pitchRef = useRef(null);
  const rafRef = useRef(null);
  const pendingPctRef = useRef(null);

  /** User-chosen team; falls back to `initialTeamId` / first row du sélecteur. */
  const [pickedTeamId, setPickedTeamId] = useState(null);

  const [browserFullscreen, setBrowserFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const el = mainRef.current;
      if (!el) return;
      const active =
        document.fullscreenElement === el ||
        document.webkitFullscreenElement === el;
      setBrowserFullscreen(active);
    };

    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggleBrowserFullscreen = useCallback(async () => {
    const el = mainRef.current;
    if (!el) return;
    try {
      const fsEl = document.fullscreenElement;
      const fsElWeb = document.webkitFullscreenElement;
      const current = fsEl ?? fsElWeb;
      if (current === el) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      }
    } catch {
      /* strict mode / missing gesture */
    }
  }, []);

  const useBuiltinBotolaPicker = standingsPickerExternal == null;

  const {
    data: stats = [],
    isLoading: botolaStandingsLoading,
    isError: botolaStandingsError,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchBotolaStandingsTables,
    enabled: useBuiltinBotolaPicker,
  });

  const standingsLoading = useBuiltinBotolaPicker
    ? botolaStandingsLoading
    : Boolean(standingsPickerExternal?.isLoading);

  const standingsError = useBuiltinBotolaPicker
    ? botolaStandingsError
    : Boolean(standingsPickerExternal?.isError);

  const standingsRowsRaw = useMemo(() => {
    if (useBuiltinBotolaPicker) {
      return stats[0]?.rows || [];
    }
    return standingsPickerExternal?.rows || [];
  }, [stats, standingsPickerExternal, useBuiltinBotolaPicker]);

  const standingsRows = useMemo(() => {
    const seen = new Set();
    const list = standingsRowsRaw;
    const out = [];
    for (const row of list) {
      const id = row?.team?.id;
      if (id == null || seen.has(id)) continue;
      seen.add(id);
      out.push(row);
    }
    return out;
  }, [standingsRowsRaw]);

  const teamOptions = useMemo(() => {
    const out = [];
    for (const row of standingsRows) {
      const tm = row?.team;
      if (!tm?.id) continue;
      out.push({
        id: tm.id,
        label: tm.shortName || tm.name || `#${tm.id}`,
      });
    }
    const lang = (i18n.language || "ar").split("-")[0];
    out.sort((a, b) =>
      a.label.localeCompare(b.label, lang, { sensitivity: "base" })
    );
    return out;
  }, [standingsRows, i18n.language]);

  const resolvedTeamId = useMemo(() => {
    if (
      pickedTeamId != null &&
      teamOptions.some((o) => o.id === pickedTeamId)
    ) {
      return pickedTeamId;
    }
    const want = Number(initialTeamId);
    if (teamOptions.some((o) => o.id === want)) return want;
    return teamOptions[0]?.id ?? null;
  }, [pickedTeamId, teamOptions, initialTeamId]);

  const {
    data: roster = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["team-players-roster", resolvedTeamId],
    queryFn: async () => {
      const result = await fetchTeamPlayersRoster(resolvedTeamId);
      return result.players ?? [];
    },
    enabled: resolvedTeamId != null && String(resolvedTeamId).length > 0,
  });

  const [fieldById, setFieldById] = useState({});

  useEffect(() => {
    setFieldById({});
  }, [resolvedTeamId]);

  /** 'token' | 'list' + playerId — drives z-index / ghost */
  const [dragUi, setDragUi] = useState(null);
  const [listGhost, setListGhost] = useState(null);

  const playersById = useMemo(() => {
    const m = {};
    roster.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [roster]);

  const placeOnField = useCallback((playerId, x, y) => {
    setFieldById((prev) => ({ ...prev, [playerId]: { x, y } }));
  }, []);

  const removeFromField = useCallback((playerId) => {
    setFieldById((prev) => ({ ...prev, [playerId]: null }));
  }, []);

  const flushPendingPosition = useCallback(
    (playerId) => {
      const p = pendingPctRef.current;
      pendingPctRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (p && playersById[playerId]) {
        placeOnField(playerId, p.x, p.y);
      }
    },
    [placeOnField, playersById]
  );

  const schedulePosition = useCallback(
    (playerId, x, y) => {
      pendingPctRef.current = { x, y };
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pending = pendingPctRef.current;
        pendingPctRef.current = null;
        if (pending && playersById[playerId]) {
          placeOnField(playerId, pending.x, pending.y);
        }
      });
    },
    [placeOnField, playersById]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const cleanupWindowDrag = useRef(null);

  const attachWindowDrag = useCallback((session, onMove, onEnd) => {
    if (cleanupWindowDrag.current) {
      cleanupWindowDrag.current();
      cleanupWindowDrag.current = null;
    }

    const move = (ev) => onMove(ev, session);
    const end = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      cleanupWindowDrag.current = null;
      onEnd(ev, session);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    cleanupWindowDrag.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  useEffect(
    () => () => {
      if (cleanupWindowDrag.current) cleanupWindowDrag.current();
    },
    []
  );

  const handleTokenPointerDown = useCallback(
    (e, playerId) => {
      if (e.button !== 0) return;
      const pos = fieldById[playerId];
      if (!pos) return;
      const rect = pitchRef.current?.getBoundingClientRect();
      if (!rect) return;

      e.preventDefault();
      e.stopPropagation();

      const centerX = rect.left + (pos.x / 100) * rect.width;
      const centerY = rect.top + (pos.y / 100) * rect.height;
      const grabRelX = e.clientX - centerX;
      const grabRelY = e.clientY - centerY;

      const session = { mode: "token", playerId, grabRelX, grabRelY };
      setDragUi({ mode: "token", playerId });

      attachWindowDrag(
        session,
        (ev, s) => {
          const r = pitchRef.current?.getBoundingClientRect();
          if (!r) return;
          const cx = ev.clientX - s.grabRelX;
          const cy = ev.clientY - s.grabRelY;
          const { x, y } = pctFromCenterPx(cx, cy, r);
          schedulePosition(s.playerId, x, y);
        },
        (ev, s) => {
          flushPendingPosition(s.playerId);
          setDragUi(null);
        }
      );
    },
    [
      attachWindowDrag,
      fieldById,
      flushPendingPosition,
      schedulePosition,
    ]
  );

  const handleListPointerDown = useCallback(
    (e, playerId) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const session = { mode: "list", playerId };
      setDragUi({ mode: "list", playerId });
      setListGhost({ x: e.clientX, y: e.clientY });

      attachWindowDrag(
        session,
        (ev) => {
          setListGhost({ x: ev.clientX, y: ev.clientY });
        },
        (ev, s) => {
          const pitchRect = pitchRef.current?.getBoundingClientRect();

          if (
            pitchRect &&
            pointInRect(ev.clientX, ev.clientY, pitchRect)
          ) {
            const { x, y } = pctFromCenterPx(ev.clientX, ev.clientY, pitchRect);
            placeOnField(s.playerId, x, y);
          }

          setListGhost(null);
          setDragUi(null);
        }
      );
    },
    [attachWindowDrag, placeOnField]
  );

  const ghostPlayer =
    listGhost && dragUi?.mode === "list" ? playersById[dragUi.playerId] : null;

  const squadTotal = roster.length;
  const showList = !isLoading && !isError && squadTotal > 0;

  const [leftRoster, rightRoster] = useMemo(() => {
    const mid = Math.ceil(roster.length / 2);
    return [roster.slice(0, mid), roster.slice(mid)];
  }, [roster]);

  const renderPlayerCard = useCallback(
    (player) => {
      const onField = Boolean(fieldById[player.id]);
      const draggingRow =
        dragUi?.mode === "list" && dragUi.playerId === player.id;
      return (
        <div
          key={player.id}
          className={`${styles.playerCard} ${
            onField ? styles.playerCardOnField : ""
          } ${draggingRow ? styles.playerCardDragging : ""}`}
          onPointerDown={(e) => handleListPointerDown(e, player.id)}
        >
          {onField ? (
            <button
              type="button"
              className={styles.playerCardRemove}
              aria-label={t("interactive.removePlayer", { name: player.name })}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                removeFromField(player.id);
              }}
            >
              ×
            </button>
          ) : null}
          <div className={styles.playerCardAvatarWrap}>
            {player.captain ? (
              <span className={styles.playerCardCaptain}>
                {t("interactive.captain")}
              </span>
            ) : null}
            <img
              className={styles.playerCardAvatar}
              src={playerPhoto(player)}
              alt=""
              draggable={false}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackPlayerPhoto(player);
              }}
            />
          </div>
          <div className={styles.playerCardMeta}>
            <span className={styles.playerCardName}>{player.name}</span>
            <span className={styles.playerCardRole}>
              {translatePlayerPosition(t, player.role)}
            </span>
          </div>
          {onField ? (
            <span className={styles.playerCardFieldPill}>
              {t("interactive.onField")}
            </span>
          ) : (
            <span className={styles.playerCardHint} aria-hidden>
              ↓
            </span>
          )}
        </div>
      );
    },
    [dragUi, fieldById, handleListPointerDown, removeFromField, t]
  );

  const renderSidebarContent = (players, showStatus = false) => {
    if (showStatus && isLoading) {
      return (
        <p className={styles.listBenchHint}>{t("interactive.loadingSquad")}</p>
      );
    }
    if (showStatus && isError) {
      return (
        <div className={styles.listBenchHint}>
          <p>{t("interactive.errorSquad")}</p>
          <p style={{ fontSize: "0.85em", opacity: 0.85 }}>
            {error?.message || t("interactive.networkError")}
          </p>
          <button
            type="button"
            className={styles.removeBtn}
            onClick={() => refetch()}
          >
            {t("common.retry")}
          </button>
        </div>
      );
    }
    if (showStatus && !isLoading && !isError && squadTotal === 0) {
      return (
        <p className={styles.listBenchHint}>{t("interactive.emptySquad")}</p>
      );
    }
    if (showList) {
      return players.map(renderPlayerCard);
    }
    return null;
  };

  const teamPickerDisabled =
    standingsLoading ||
    standingsError ||
    teamOptions.length === 0 ||
    resolvedTeamId == null;

  return (
    <div
      ref={mainRef}
      className={`${styles.main} ${
        embedded ? styles.mainEmbedded : styles.mainFillViewport
      } ${browserFullscreen ? styles.mainBrowserFullscreen : ""}`}
    >
      {!browserFullscreen ? (
      <header className={styles.pageHeader}>
        {/* <div className={styles.pageHeaderText}>
          <p className={styles.pageEyebrow}>Écran tactique</p>
          <h1 className={styles.pageTitle}>Composer la formation</h1>
          <p className={styles.pageSubtitle}>
            Glissez les joueurs sur le terrain ; ils suivent le curseur en
            direct. Retirez-les via le bouton ou la zone de retrait.
          </p>
        </div> */}
        <div className={styles.teamPicker}>
          <label htmlFor={selectId} className={styles.teamPickerLabel}>
            {teamPickerLabel}
          </label>
          <select
            id={selectId}
            className={styles.teamSelect}
            value={resolvedTeamId != null ? String(resolvedTeamId) : ""}
            onChange={(e) => setPickedTeamId(Number(e.target.value))}
            disabled={teamPickerDisabled}
          >
            {standingsLoading ? (
              <option value="">{t("interactive.loadingTeams")}</option>
            ) : standingsError ? (
              <option value="">{t("interactive.listUnavailable")}</option>
            ) : (
              teamOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
        </div>
        <button
          type="button"
          className={styles.fullscreenToggle}
          onClick={() => void toggleBrowserFullscreen()}
          aria-pressed={browserFullscreen}
          title={
            browserFullscreen
              ? t("interactive.exitFullscreenTitle")
              : t("interactive.enterFullscreenTitle")
          }
        >
          <span className={styles.fullscreenToggleIcon} aria-hidden>
            {browserFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 4H4v5M15 20h5v-5M4 15v5h5M20 9V4h-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className={styles.fullscreenToggleLabel}>
            {browserFullscreen
              ? t("interactive.exitFullscreen")
              : t("interactive.fullscreen")}
          </span>
        </button>
        {/* <div className={styles.pageStat}>
          <span className={styles.pageStatValue}>
            {onPitchCount}/{squadTotal || "—"}
          </span>
          <span className={styles.pageStatLabel}>sur le terrain</span>
        </div> */}
      </header>
      ) : null}

      <div
        className={`${styles.layout} ${
          browserFullscreen ? styles.layoutFullscreen : ""
        }`}
      >
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            {!browserFullscreen ? (
              <div className={styles.sidebarCardHead}>
                <h2 className={styles.sidebarTitle}>
                  {t("interactive.squad")}
                </h2>
              </div>
            ) : null}
            <div className={styles.playerList}>
              {renderSidebarContent(leftRoster, true)}
            </div>
          </div>
        </aside>

        <div className={styles.pitchColumn}>
          {/* <div className={styles.pitchColumnHead}>
            <h2 className={styles.pitchHeading}>Terrain</h2>
            <p className={styles.pitchHint}>
              But à gauche / à droite · repositionnement libre
            </p>
          </div> */}
          <div className={styles.pitchWrap}>
            {browserFullscreen ? (
              <button
                type="button"
                className={styles.fullscreenExitFab}
                onClick={() => void toggleBrowserFullscreen()}
                title={t("interactive.exitFullscreenTitle")}
              >
                <span className={styles.fullscreenToggleIcon} aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 4H4v5M15 20h5v-5M4 15v5h5M20 9V4h-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            ) : null}
            <div
              ref={pitchRef}
              className={`${styles.pitch} ${
                dragUi?.mode === "list" ? styles.pitchDropHint : ""
              }`}
            >
              <div className={styles.pitchGrass} aria-hidden />
              <PitchMarkingsSvg className={styles.pitchSvg} />

              {showList
                ? roster.map((player) => {
                    const pos = fieldById[player.id];
                    if (!pos) return null;
                    const isDraggingToken =
                      dragUi?.mode === "token" && dragUi.playerId === player.id;
                    return (
                      <div
                        key={player.id}
                        className={`${styles.token} ${
                          isDraggingToken ? styles.tokenDragging : ""
                        }`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                        onPointerDown={(e) =>
                          handleTokenPointerDown(e, player.id)
                        }
                      >
                        <div className={styles.tokenCard}>
                          <div className={styles.tokenInner}>
                            <div className={styles.tokenAvatarWrap}>
                              {player.captain ? (
                                <span className={styles.tokenCaptain}>
                                  {t("interactive.captain")}
                                </span>
                              ) : null}
                              <img
                                className={styles.tokenAvatar}
                                src={playerPhoto(player)}
                                alt=""
                                draggable={false}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    fallbackPlayerPhoto(player);
                                }}
                              />
                              {/* <span
                                className={`${styles.tokenRating} ${ratingClass}`}
                              >
                                {player.rating}
                              </span> */}
                            </div>
                            <div className={styles.tokenLabel}>
                              <span className={styles.tokenName}>
                                {player.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                : null}
            </div>
          </div>
        </div>

        <aside className={`${styles.sidebar} ${styles.sidebarRight}`}>
          <div className={styles.sidebarCard}>
            <div className={styles.playerList}>
              {renderSidebarContent(rightRoster)}
            </div>
          </div>
        </aside>
      </div>

      {listGhost && ghostPlayer ? (
        <div
          className={styles.listDragGhost}
          style={{
            left: listGhost.x,
            top: listGhost.y,
          }}
        >
          <img
            src={playerPhoto(ghostPlayer)}
            alt=""
            draggable={false}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackPlayerPhoto(ghostPlayer);
            }}
          />
          <span>{ghostPlayer.name}</span>
        </div>
      ) : null}
    </div>
  );
}
