import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./InteractiveScreen.module.scss";
import { DEFAULT_FORMATION_SLOTS_4231 } from "./staticInteractivePlayers";
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
 * @param {{ teamId?: number | string }} props Optional SofaScore team id used once Botola list loads (defaults internally otherwise).
 */
export default function InteractiveScreen({
  teamId: initialTeamId = DEFAULT_SOFA_TEAM_ID,
}) {
  const pitchRef = useRef(null);
  const benchRef = useRef(null);
  const rafRef = useRef(null);
  const pendingPctRef = useRef(null);

  /** User-chosen team; falls back to `initialTeamId` / first Botola row via `resolvedTeamId`. */
  const [pickedTeamId, setPickedTeamId] = useState(null);

  const {
    data: stats = [],
    isLoading: standingsLoading,
    isError: standingsError,
  } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchBotolaStandingsTables,
  });

  const standingsRows = useMemo(() => stats[0]?.rows || [], [stats]);

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
    if (!roster.length) {
      setFieldById({});
      return;
    }
    const slots = DEFAULT_FORMATION_SLOTS_4231;
    const next = {};
    roster.forEach((p, i) => {
      next[p.id] = i < slots.length ? { ...slots[i] } : null;
    });
    setFieldById(next);
  }, [roster]);

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

  const onPitchCount = useMemo(
    () => Object.values(fieldById).filter(Boolean).length,
    [fieldById]
  );

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
          const benchRect = benchRef.current?.getBoundingClientRect();
          if (pointInRect(ev.clientX, ev.clientY, benchRect)) {
            removeFromField(s.playerId);
          }
          setDragUi(null);
        }
      );
    },
    [
      attachWindowDrag,
      fieldById,
      flushPendingPosition,
      removeFromField,
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
          const benchRect = benchRef.current?.getBoundingClientRect();

          if (pointInRect(ev.clientX, ev.clientY, benchRect)) {
            removeFromField(s.playerId);
          } else if (
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
    [attachWindowDrag, placeOnField, removeFromField]
  );

  const ratingClassFor = (player) =>
    styles[
      `rating${
        player.ratingColor.charAt(0).toUpperCase() + player.ratingColor.slice(1)
      }`
    ];

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
    <div className={styles.main}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <p className={styles.pageEyebrow}>Écran tactique</p>
          <h1 className={styles.pageTitle}>Composer la formation</h1>
          <p className={styles.pageSubtitle}>
            Glissez les joueurs sur le terrain ; ils suivent le curseur en
            direct. Retirez-les via le bouton ou la zone de retrait.
          </p>
        </div>
        <div className={styles.teamPicker}>
          <label
            htmlFor="interactive-botola-team"
            className={styles.teamPickerLabel}
          >
            Équipe Botola Pro
          </label>
          <select
            id="interactive-botola-team"
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
        <div className={styles.pageStat}>
          <span className={styles.pageStatValue}>
            {onPitchCount}/{squadTotal || "—"}
          </span>
          <span className={styles.pageStatLabel}>sur le terrain</span>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHead}>
              <h2 className={styles.sidebarTitle}>Effectif</h2>
              <span className={styles.sidebarTag}>4-2-3-1</span>
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
                        className={`${styles.listItem} ${
                          onField ? styles.listItemOnField : ""
                        } ${draggingRow ? styles.listItemDragging : ""}`}
                        onPointerDown={(e) =>
                          handleListPointerDown(e, player.id)
                        }
                      >
                        <span className={styles.listNumber}>
                          {player.number}
                        </span>
                        <img
                          className={styles.listAvatar}
                          src={playerPhotoUrl(player)}
                          alt=""
                          draggable={false}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackAvatarUrl(player);
                          }}
                        />
                        <div className={styles.listMeta}>
                          <div className={styles.listNameRow}>
                            <span className={styles.listName}>
                              {player.captain ? (
                                <span
                                  className={styles.captainMark}
                                  title="Capitaine"
                                >
                                  c
                                </span>
                              ) : null}
                              {player.name}
                            </span>
                            {/* <span
                              className={`${styles.listRating} ${ratingClassFor(
                                player
                              )}`}
                            >
                              {player.rating}
                            </span> */}
                          </div>
                          <div className={styles.listSub}>
                            <span className={styles.rolePill}>
                              {player.role}
                            </span>
                            {onField ? (
                              <span className={styles.onFieldDot}>Terrain</span>
                            ) : (
                              <span className={styles.benchHint}>
                                Glisser →
                              </span>
                            )}
                          </div>
                        </div>
                        {onField ? (
                          <button
                            type="button"
                            className={styles.removeBtn}
                            aria-label={`Retirer ${player.name} du terrain`}
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromField(player.id);
                            }}
                          >
                            <span className={styles.removeBtnIcon} aria-hidden>
                              ×
                            </span>
                            Retirer
                          </button>
                        ) : null}
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

          <div
            ref={benchRef}
            className={`${styles.sidebarDrop} ${
              dragUi ? styles.sidebarDropActive : ""
            }`}
          >
            <span className={styles.sidebarDropIcon} aria-hidden>
              ↓
            </span>
            <span className={styles.sidebarDropTitle}>Zone de retrait</span>
            <span className={styles.sidebarDropText}>
              Déposez un joueur ici pour l’enlever du terrain
            </span>
          </div>
        </aside>

        <div className={styles.pitchColumn}>
          <div className={styles.pitchColumnHead}>
            <h2 className={styles.pitchHeading}>Terrain</h2>
            <p className={styles.pitchHint}>
              But en haut · repositionnement libre
            </p>
          </div>
          <div className={styles.pitchWrap}>
            <div
              ref={pitchRef}
              className={`${styles.pitch} ${
                dragUi?.mode === "list" ? styles.pitchDropHint : ""
              }`}
            >
              <div className={styles.pitchGrass} aria-hidden />
              <div className={styles.pitchMarkings} aria-hidden>
                <div className={styles.goalLine} />
                <div className={styles.penaltyBox} />
                <div className={styles.penaltySpot} />
                <div className={styles.midLine} />
                <div className={styles.centerSpot} />
                <div className={styles.penaltyArc} />
              </div>

              {showList
                ? roster.map((player) => {
                    const pos = fieldById[player.id];
                    if (!pos) return null;
                    const isDraggingToken =
                      dragUi?.mode === "token" && dragUi.playerId === player.id;
                    const ratingClass = ratingClassFor(player);
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
