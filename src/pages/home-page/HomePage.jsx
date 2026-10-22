import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import styles from "./HomePage.module.scss";
import {
  FOTMOB,
  IMG,
  LEAGUES,
  LEAGUE_IDS,
  LEAGUE_FR,
  COUNTRY_FR,
  INTL_CODES,
  FALLBACK_TRANSFERS,
  FOLLOWED_TEAMS,
  FOLLOWED_LEAGUES,
  PINNED_LEAGUE_IDS,
} from "./data/data.helper";
import {
  startOfDay,
  shiftDay,
  isSameDay,
  toFotmobDate,
  toInputDate,
  dateLabel,
  teamLogo,
  playerPhoto,
  leagueLogo,
  displayLeagueName,
  isLive,
  isFinished,
  collectPinnedTeamMatches,
  extractMoroccanPlayers,
  mapInChunks,
} from "./helpers/function.helper";

function leagueTitle(league) {
  const name = displayLeagueName(league);
  const country = COUNTRY_FR[league.ccode];
  if (country && !INTL_CODES.has(league.ccode) && country !== name) {
    return `${country} - ${name}`;
  }
  return name;
}

function extractLeagues(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.leagues)) return data.leagues;
  return [];
}

function isOnTv(match) {
  return !isFinished(match) && !match?.status?.cancelled;
}

function liveMinute(match) {
  const reason = match?.status?.reason?.short;
  if (reason === "HT") return "MT";
  const short = match?.status?.liveTime?.short;
  if (!short) return null;
  const normalized = String(short)
    .replace(/[\u200E\u200F\u202A-\u202E’']/g, "")
    .trim();
  if (/^ht$/i.test(normalized)) return "MT";
  const cleaned = normalized.replace(/[^\d+]/g, "");
  return cleaned || null;
}

function kickoffTime(match) {
  const fromLabel = match?.time?.split(" ").pop();
  if (fromLabel) return fromLabel.slice(0, 5);
  if (!match?.timeTS) return "";
  return new Date(match.timeTS).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusText(match) {
  if (match?.status?.cancelled) {
    const short = match.status.reason?.short;
    if (short === "PP") return "Rep.";
    return "Ann.";
  }
  if (isFinished(match)) return "FM";
  if (isLive(match)) {
    const minute = liveMinute(match);
    if (minute === "MT") return "MT";
    return null;
  }
  return kickoffTime(match);
}

function playerMatchLabel(match) {
  if (!match) return "";
  if (isLive(match)) {
    const minute = liveMinute(match);
    if (minute === "MT") return "MT";
    return minute ? `${minute}'` : "Live";
  }
  return statusText(match) || kickoffTime(match);
}

function scoreLabel(match) {
  if (match?.status?.cancelled) return "";
  if (match?.status?.started || match?.status?.finished) {
    return (
      match.status.scoreStr ||
      `${match.home?.score ?? 0} - ${match.away?.score ?? 0}`
    );
  }
  return "";
}

function matchQueryText(league, match) {
  return [
    league.name,
    league.ccode,
    match.home?.name,
    match.away?.name,
    match.home?.longName,
    match.away?.longName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function formatMoney(value) {
  if (typeof value !== "number" || value <= 0) return null;
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded = Number.isInteger(millions)
      ? millions
      : Math.round(millions * 10) / 10;
    return `${rounded} M€`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} K€`;
  return `${value} €`;
}

function formatTransferFee(row) {
  const money = formatMoney(row.fee?.value ?? row.amountEuroEstimated);
  if (money) return money;
  const text = row.fee?.feeText;
  if (!text || text === "fee") return "—";
  if (/free/i.test(text)) return "Libre";
  if (/loan/i.test(text)) return "Prêt";
  return text;
}

function normalizeTransfers(payload) {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.transfers)
      ? payload.transfers
      : [];

  const list = raw.filter(
    (row) =>
      !row.contractExtension &&
      row.toClubId &&
      row.fromClubId &&
      row.fromClubId !== 2,
  );

  return (list.length ? list : raw).slice(0, 3).map((row) => ({
    playerId: row.playerId || row.player?.id,
    name: row.name || row.player?.name || "Joueur",
    fromId: row.fromClubId || row.fromClub?.id,
    toId: row.toClubId || row.toClub?.id,
    fee: formatTransferFee(row),
  }));
}

function HomePage() {
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [liveOnly, setLiveOnly] = useState(false);
  const [tvOnly, setTvOnly] = useState(false);
  const [byHour, setByHour] = useState(false);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const filtersRef = useRef(null);

  const dateKey = toFotmobDate(date);

  const { data, isLoading, error } = useQuery({
    queryKey: ["fixtures", dateKey],
    queryFn: async () => {
      const response = await axios.get(
        `${FOTMOB}/api/data/matches?date=${dateKey}&timezone=Africa%2FCasablanca&ccode3=MAR&includeNextDayLateNight=true`,
      );
      return response.data;
    },
    refetchInterval: 20_000,
  });

  const { data: transfers } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      try {
        const response = await axios.get(`${FOTMOB}/api/data/transfers`);
        const parsed = normalizeTransfers(response.data);
        return parsed.length ? parsed.slice(0, 3) : FALLBACK_TRANSFERS;
      } catch {
        return FALLBACK_TRANSFERS;
      }
    },
    staleTime: 5 * 60_000,
  });

  const pinnedTeamMatches = useMemo(
    () => collectPinnedTeamMatches(extractLeagues(data), PINNED_LEAGUE_IDS),
    [data],
  );

  const pinnedTeamIds = useMemo(
    () => [...pinnedTeamMatches.keys()].sort((a, b) => a - b),
    [pinnedTeamMatches],
  );

  const { data: moroccanSquads, isLoading: squadsLoading } = useQuery({
    queryKey: ["moroccanSquads", dateKey, pinnedTeamIds],
    enabled: pinnedTeamIds.length > 0,
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const entries = await mapInChunks(pinnedTeamIds, 5, async (teamId) => {
        try {
          const response = await axios.get(
            `${FOTMOB}/api/data/teams?id=${teamId}&ccode3=MAR`,
          );
          return [teamId, extractMoroccanPlayers(response.data)];
        } catch {
          return [teamId, []];
        }
      });
      return Object.fromEntries(entries);
    },
  });

  const moroccanPlayers = useMemo(() => {
    const list = [];
    pinnedTeamMatches.forEach((context, teamId) => {
      const players = moroccanSquads?.[teamId] || [];
      players.forEach((player) => {
        list.push({ ...player, ...context });
      });
    });
    return list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [moroccanSquads, pinnedTeamMatches]);

  useEffect(() => {
    const onPointer = (event) => {
      if (!filtersRef.current?.contains(event.target)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  const visibleLeagues = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const followedOrder = new Map(
      FOLLOWED_LEAGUES.map((league, index) => [league.id, index]),
    );
    return extractLeagues(data)
      .filter((league) => LEAGUE_IDS.has(league.primaryId))
      .filter((league) =>
        selectedLeagueId == null ? true : league.primaryId === selectedLeagueId,
      )
      .map((league) => {
        const matches = (league.matches || []).filter((match) => {
          if (liveOnly && !isLive(match)) return false;
          if (tvOnly && !isOnTv(match)) return false;
          if (selectedTeamId != null) {
            if (
              match.home?.id !== selectedTeamId &&
              match.away?.id !== selectedTeamId
            )
              return false;
          }
          if (needle && !matchQueryText(league, match).includes(needle))
            return false;
          return true;
        });
        return { ...league, matches };
      })
      .filter((league) => league.matches.length > 0)
      .sort((a, b) => {
        const ai = followedOrder.has(a.primaryId)
          ? followedOrder.get(a.primaryId)
          : 1000;
        const bi = followedOrder.has(b.primaryId)
          ? followedOrder.get(b.primaryId)
          : 1000;
        return ai - bi;
      });
  }, [data, liveOnly, tvOnly, query, selectedLeagueId, selectedTeamId]);

  const hourGroups = useMemo(() => {
    if (!byHour) return [];
    const buckets = new Map();
    visibleLeagues.forEach((league) => {
      league.matches.forEach((match) => {
        const hour = kickoffTime(match) || "—";
        if (!buckets.has(hour)) buckets.set(hour, []);
        buckets.get(hour).push({ league, match });
      });
    });
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [byHour, visibleLeagues]);

  const toggleCollapsed = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNativeDate = (event) => {
    const value = event.target.value;
    if (!value) return;
    const [year, month, day] = value.split("-").map(Number);
    setDate(startOfDay(new Date(year, month - 1, day)));
  };

  const resetView = () => {
    setDate(startOfDay(new Date()));
    setLiveOnly(false);
    setTvOnly(false);
    setByHour(false);
    setQuery("");
    setFiltersOpen(false);
    setCollapsed(new Set());
    setSelectedTeamId(null);
    setSelectedLeagueId(null);
  };

  const toggleTeam = (id) => {
    setSelectedTeamId((current) => (current === id ? null : id));
    setSelectedLeagueId(null);
  };

  const toggleLeague = (id) => {
    setSelectedLeagueId((current) => (current === id ? null : id));
    setSelectedTeamId(null);
  };

  const selectedLeague = FOLLOWED_LEAGUES.find(
    (league) => league.id === selectedLeagueId,
  );
  const selectedTeam =
    FOLLOWED_TEAMS.find((team) => team.id === selectedTeamId) ||
    (selectedTeamId != null
      ? moroccanPlayers.find((row) => row.teamId === selectedTeamId)
      : null);
  const selectedTeamName = selectedTeam?.name || selectedTeam?.teamName;

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.leftCol}>
          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Équipes suivies</h2>
            <ul className={styles.sideList}>
              {FOLLOWED_TEAMS.map((team) => (
                <li key={team.id}>
                  <button
                    type="button"
                    className={`${styles.sideItem} ${selectedTeamId === team.id ? styles.sideItemActive : ""}`}
                    aria-pressed={selectedTeamId === team.id}
                    onClick={() => toggleTeam(team.id)}
                  >
                    <img
                      className={styles.teamAvatar}
                      src={teamLogo(team.id)}
                      alt=""
                    />
                    <span>{team.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.sideCard}>
            <h2 className={styles.sideTitle}>Ligues suivies</h2>
            <ul className={styles.sideList}>
              {FOLLOWED_LEAGUES.map((league) => (
                <li key={league.id}>
                  <button
                    type="button"
                    className={`${styles.sideItem} ${selectedLeagueId === league.id ? styles.sideItemActive : ""}`}
                    aria-pressed={selectedLeagueId === league.id}
                    onClick={() => toggleLeague(league.id)}
                  >
                    <img
                      className={styles.leagueMark}
                      src={leagueLogo(league.id)}
                      alt=""
                    />
                    <span>{league.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className={styles.centerCol}>
          <section className={styles.mainCard}>
            <header className={styles.toolbar}>
              <div className={styles.dateRow}>
                <button
                  type="button"
                  className={styles.dateArrow}
                  aria-label="Jour précédent"
                  onClick={() => setDate((current) => shiftDay(current, -1))}
                >
                  <i className="fi fi-rr-angle-left" />
                </button>

                <label className={styles.dateLabel}>
                  <span>{dateLabel(date)}</span>
                  <i className="fi fi-rr-angle-small-down" />
                  <input
                    type="date"
                    className={styles.nativeDate}
                    value={toInputDate(date)}
                    onChange={handleNativeDate}
                    aria-label="Choisir une date"
                  />
                </label>

                <button
                  type="button"
                  className={styles.dateArrow}
                  aria-label="Jour suivant"
                  onClick={() => setDate((current) => shiftDay(current, 1))}
                >
                  <i className="fi fi-rr-angle-right" />
                </button>
              </div>

              <div className={styles.filtersRow}>
                <button
                  type="button"
                  className={`${styles.pill} ${liveOnly ? styles.pillActive : ""}`}
                  aria-pressed={liveOnly}
                  onClick={() => setLiveOnly((value) => !value)}
                >
                  <span
                    className={`${styles.liveDot} ${liveOnly ? styles.liveDotOn : ""}`}
                  />
                  En direct
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${tvOnly ? styles.pillActive : ""}`}
                  aria-pressed={tvOnly}
                  onClick={() => setTvOnly((value) => !value)}
                >
                  À la TV
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${byHour ? styles.pillActive : ""}`}
                  aria-pressed={byHour}
                  onClick={() => setByHour((value) => !value)}
                >
                  Par heure
                </button>

                <div className={styles.filtersWrap} ref={filtersRef}>
                  <button
                    type="button"
                    className={`${styles.pill} ${filtersOpen || query ? styles.pillActive : ""}`}
                    aria-pressed={Boolean(filtersOpen || query)}
                    onClick={() => setFiltersOpen((value) => !value)}
                  >
                    <span className={styles.filterIcon} aria-hidden="true" />
                    Filtres
                  </button>
                  {filtersOpen ? (
                    <div className={styles.filtersPanel}>
                      <input
                        type="search"
                        placeholder="Équipe ou compétition"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        autoFocus
                      />
                    </div>
                  ) : null}
                </div>

                {selectedLeague ? (
                  <button
                    type="button"
                    className={styles.filterChip}
                    onClick={() => toggleLeague(selectedLeague.id)}
                    aria-label={`Retirer le filtre ${selectedLeague.name}`}
                  >
                    <img src={leagueLogo(selectedLeague.id)} alt="" />
                    <span>{selectedLeague.name}</span>
                    <i className="fi fi-rr-cross-small" />
                  </button>
                ) : null}
                {selectedTeamId != null && selectedTeamName ? (
                  <button
                    type="button"
                    className={styles.filterChip}
                    onClick={() => toggleTeam(selectedTeamId)}
                    aria-label={`Retirer le filtre ${selectedTeamName}`}
                  >
                    <img src={teamLogo(selectedTeamId)} alt="" />
                    <span>{selectedTeamName}</span>
                    <i className="fi fi-rr-cross-small" />
                  </button>
                ) : null}

                <button
                  type="button"
                  className={styles.reset}
                  aria-label="Réinitialiser"
                  onClick={resetView}
                >
                  <i className="fi fi-rr-hourglass" />
                </button>
              </div>
            </header>

            <div className={styles.list}>
              {isLoading ? (
                <p className={styles.state}>Chargement des matchs…</p>
              ) : error ? (
                <p className={styles.state}>
                  Impossible de charger les matchs.
                </p>
              ) : visibleLeagues.length === 0 ? (
                <p className={styles.state}>
                  Aucun match pour cette sélection.
                </p>
              ) : byHour ? (
                hourGroups.map(([hour, rows]) => (
                  <article key={hour} className={styles.group}>
                    <button
                      type="button"
                      className={styles.groupHeader}
                      onClick={() => toggleCollapsed(hour)}
                    >
                      <span className={styles.groupTitle}>{hour}</span>
                      <i
                        className={`fi ${collapsed.has(hour) ? "fi-rr-angle-small-down" : "fi-rr-angle-small-up"}`}
                      />
                    </button>
                    {!collapsed.has(hour) &&
                      rows.map(({ match }) => (
                        <MatchRow
                          key={match.id}
                          match={match}
                          showTv={isOnTv(match)}
                        />
                      ))}
                  </article>
                ))
              ) : (
                visibleLeagues.map((league) => {
                  const open = !collapsed.has(league.id);
                  return (
                    <article key={league.id} className={styles.group}>
                      <button
                        type="button"
                        className={`${styles.groupHeader} ${selectedLeagueId === league.primaryId ? styles.groupHeaderSelected : ""}`}
                        onClick={() => toggleCollapsed(league.id)}
                      >
                        <img
                          className={styles.flag}
                          src={leagueLogo(league.primaryId)}
                          alt=""
                        />
                        <span className={styles.groupTitle}>
                          {leagueTitle(league)}
                        </span>
                        <i
                          className={`fi ${open ? "fi-rr-angle-small-up" : "fi-rr-angle-small-down"}`}
                        />
                      </button>
                      {open &&
                        league.matches.map((match) => (
                          <MatchRow
                            key={match.id}
                            match={match}
                            showTv={isOnTv(match)}
                          />
                        ))}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <section className={styles.sideCard}>
            <div className={styles.transferHead}>
              <div>
                <h2 className={styles.sideTitle}>Marocains du jour</h2>
                <p className={styles.sideSub}>
                  {squadsLoading
                    ? "Chargement…"
                    : `${moroccanPlayers.length} joueur${moroccanPlayers.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            {squadsLoading && moroccanPlayers.length === 0 ? (
              <p className={styles.sideEmpty}>Chargement des effectifs…</p>
            ) : moroccanPlayers.length === 0 ? (
              <p className={styles.sideEmpty}>Aucun Marocain aujourd'hui</p>
            ) : (
              <ul className={styles.marocList}>
                {moroccanPlayers.map((row) => (
                  <li key={`${row.id}-${row.teamId}`}>
                    <button
                      type="button"
                      className={`${styles.marocRow} ${selectedTeamId === row.teamId ? styles.marocRowActive : ""}`}
                      aria-pressed={selectedTeamId === row.teamId}
                      onClick={() => toggleTeam(row.teamId)}
                    >
                      <img
                        className={styles.playerPhoto}
                        src={playerPhoto(row.id)}
                        alt=""
                      />
                      <div className={styles.transferMeta}>
                        <strong>
                          {row.name}
                          {row.injured ? (
                            <span className={styles.injuredBadge}>Blessé</span>
                          ) : null}
                        </strong>
                        <div className={styles.marocMeta}>
                          <img src={teamLogo(row.teamId)} alt="" />
                          <span>vs {row.opponentName}</span>
                        </div>
                      </div>
                      <span
                        className={`${styles.marocTime} ${isLive(row.match) ? styles.marocTimeLive : ""}`}
                      >
                        {playerMatchLabel(row.match)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.sideCard}>
            <div className={styles.transferHead}>
              <div>
                <h2 className={styles.sideTitle}>Meilleurs transferts</h2>
                <p className={styles.sideSub}>Par date</p>
              </div>
              <i className="fi fi-rr-settings-sliders" />
            </div>
            <ul className={styles.transferList}>
              {(transfers || FALLBACK_TRANSFERS).map((row) => (
                <li
                  key={`${row.playerId}-${row.name}`}
                  className={styles.transferRow}
                >
                  <img
                    className={styles.playerPhoto}
                    src={playerPhoto(row.playerId)}
                    alt=""
                  />
                  <div className={styles.transferMeta}>
                    <strong>{row.name}</strong>
                    <div className={styles.transferClubs}>
                      {row.fromId && row.fromId !== 2 ? (
                        <img src={teamLogo(row.fromId)} alt="" />
                      ) : null}
                      <span className={styles.transferArrow} />
                      {row.toId ? (
                        <img src={teamLogo(row.toId)} alt="" />
                      ) : null}
                    </div>
                  </div>
                  <span className={styles.transferFee}>{row.fee}</span>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.transferCta}>
              Centre des Transferts
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MatchRow({ match, showTv }) {
  const live = isLive(match);
  const minute = live ? liveMinute(match) : null;
  const showMinute = live && minute !== "MT";
  const status = statusText(match);
  const score = scoreLabel(match);

  return (
    <div className={styles.match}>
      <div className={styles.statusCol}>
        {showMinute ? <span className={styles.minute}>{minute}</span> : null}
      </div>

      <div className={`${styles.team} ${styles.home}`}>
        {match.home?.redCards ? (
          <span className={styles.redCard}>{match.home.redCards}</span>
        ) : null}
        <span className={styles.teamName}>{match.home?.name}</span>
        <img className={styles.crest} src={teamLogo(match.home?.id)} alt="" />
      </div>

      <div className={`${styles.center} ${live ? styles.centerLive : ""}`}>
        {score || status}
      </div>

      <div className={`${styles.team} ${styles.away}`}>
        <img className={styles.crest} src={teamLogo(match.away?.id)} alt="" />
        <span className={styles.teamName}>{match.away?.name}</span>
        {match.away?.redCards ? (
          <span className={styles.redCard}>{match.away.redCards}</span>
        ) : null}
      </div>

      <div className={styles.tvCol}>
        {live ? (
          <i className={`fi fi-rr-headphones ${styles.audioIcon}`} />
        ) : null}
        {showTv ? <span className={styles.tvBadge}>tv</span> : null}
      </div>
    </div>
  );
}

export default HomePage;
