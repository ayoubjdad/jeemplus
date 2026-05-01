import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./InteractiveScreen.module.scss";
import { fetchBotolaStandingsTables } from "../../api/botolaStandings";
import {
  DEFAULT_SOFA_TEAM_ID,
  fetchTeamPlayersRoster,
} from "./sofaTeamPlayersApi";

function fallbackAvatarUrl(player) {
  const label = encodeURIComponent(
    String(player?.name ?? "?").replace(/\s+/g, "+")
  );
  return `https://ui-avatars.com/api/?name=${label}&size=128&background=0f292e&color=c5e8e0&bold=true`;
}

function playerPhotoUrl(player) {
  if (player?.sofaPlayerId) {
    return `https://img.sofascore.com/api/v1/player/${player.sofaPlayerId}/image`;
  }
  return fallbackAvatarUrl(player);
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
  teamId: initialTeamId = DEFAULT_SOFA_TEAM_ID,
  standingsPicker: standingsPickerExternal = null,
  teamPickerLabel = "Équipe Botola Pro",
  selectId = "interactive-botola-team",
  embedded = false,
}) {
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
      const t = row?.team;
      if (!t?.id) continue;
      out.push({
        id: t.id,
        label: t.shortName || t.name || `#${t.id}`,
      });
    }
    out.sort((a, b) =>
      a.label.localeCompare(b.label, "fr", { sensitivity: "base" })
    );
    return out;
  }, [standingsRows]);

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
    queryKey: ["sofa-team-players", resolvedTeamId],
    queryFn: () => fetchTeamPlayersRoster(resolvedTeamId),
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
              <option value="">Chargement des équipes…</option>
            ) : standingsError ? (
              <option value="">Liste indisponible</option>
            ) : (
              teamOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
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
              ? "Quitter le plein écran (Échap)"
              : "Afficher en plein écran"
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
            {browserFullscreen ? "Quitter plein écran" : "Plein écran"}
          </span>
        </button>
        {/* <div className={styles.pageStat}>
          <span className={styles.pageStatValue}>
            {onPitchCount}/{squadTotal || "—"}
          </span>
          <span className={styles.pageStatLabel}>sur le terrain</span>
        </div> */}
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHead}>
              <h2 className={styles.sidebarTitle}>Effectif</h2>
              {/*  <span className={styles.sidebarTag}>4-2-3-1</span> */}
            </div>
            <div className={styles.playerList}>
              {isLoading ? (
                <p className={styles.listBenchHint}>
                  Chargement de l’effectif…
                </p>
              ) : null}
              {isError ? (
                <div className={styles.listBenchHint}>
                  <p>Impossible de charger l’effectif.</p>
                  <p style={{ fontSize: "0.85em", opacity: 0.85 }}>
                    {error?.message || "Erreur réseau"}
                  </p>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => refetch()}
                  >
                    Réessayer
                  </button>
                </div>
              ) : null}
              {showList
                ? roster.map((player) => {
                    const onField = Boolean(fieldById[player.id]);
                    const draggingRow =
                      dragUi?.mode === "list" && dragUi.playerId === player.id;
                    return (
                      <div
                        key={player.id}
                        className={`${styles.playerCard} ${
                          onField ? styles.playerCardOnField : ""
                        } ${draggingRow ? styles.playerCardDragging : ""}`}
                        onPointerDown={(e) =>
                          handleListPointerDown(e, player.id)
                        }
                      >
                        {onField ? (
                          <button
                            type="button"
                            className={styles.playerCardRemove}
                            aria-label={`Retirer ${player.name} du terrain`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromField(player.id);
                            }}
                          >
                            ×
                          </button>
                        ) : null}
                        <div className={styles.playerCardBadge}>
                          {player.number}
                        </div>
                        <div className={styles.playerCardAvatarWrap}>
                          {player.captain ? (
                            <span className={styles.playerCardCaptain}>
                              c
                            </span>
                          ) : null}
                          <img
                            className={styles.playerCardAvatar}
                            src={playerPhotoUrl(player)}
                            alt=""
                            draggable={false}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackAvatarUrl(player);
                            }}
                          />
                        </div>
                        <span className={styles.playerCardName}>{player.name}</span>
                        <span className={styles.playerCardRole}>{player.role}</span>
                        {onField ? (
                          <span className={styles.playerCardFieldPill}>Terrain</span>
                        ) : (
                          <span className={styles.playerCardHint}>→ terrain</span>
                        )}
                      </div>
                    );
                  })
                : null}
              {!isLoading && !isError && squadTotal === 0 ? (
                <p className={styles.listBenchHint}>
                  Aucun joueur renvoyé par l’API.
                </p>
              ) : null}
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
            <div
              ref={pitchRef}
              className={`${styles.pitch} ${
                dragUi?.mode === "list" ? styles.pitchDropHint : ""
              }`}
            >
              <div className={styles.pitchGrass} aria-hidden />
              <div className={styles.pitchMarkings} aria-hidden>
                <div className={styles.goalLineLeft} />
                <div className={styles.goalLineRight} />
                <div className={styles.penaltyBoxLeft} />
                <div className={styles.penaltyBoxRight} />
                <div className={styles.penaltySpotLeft} />
                <div className={styles.penaltySpotRight} />
                <div className={styles.midLineVertical} />
                <div className={styles.centerSpot} />
                <div className={styles.penaltyArcLeft} />
                <div className={styles.penaltyArcRight} />
              </div>

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
                                <span className={styles.tokenCaptain}>c</span>
                              ) : null}
                              <img
                                className={styles.tokenAvatar}
                                src={playerPhotoUrl(player)}
                                alt=""
                                draggable={false}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    fallbackAvatarUrl(player);
                                }}
                              />
                              {/* <span
                                className={`${styles.tokenRating} ${ratingClass}`}
                              >
                                {player.rating}
                              </span> */}
                            </div>
                            <div className={styles.tokenLabel}>
                              <span className={styles.tokenJersey}>
                                {player.number}
                              </span>
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
            src={playerPhotoUrl(ghostPlayer)}
            alt=""
            draggable={false}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallbackAvatarUrl(ghostPlayer);
            }}
          />
          <span>
            #{ghostPlayer.number} {ghostPlayer.name}
          </span>
        </div>
      ) : null}
    </div>
  );
}
