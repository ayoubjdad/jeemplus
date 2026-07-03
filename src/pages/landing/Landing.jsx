import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import styles from "./Landing.module.scss";
import { gamesFormatDate } from "../../helpers/global.helper";
import { groupGamesByCompetition } from "../../helpers/groupGamesByCompetition";
import { getFixturesByDate } from "../../api/football/services/fixturesService";
import { getMoroccanPlayersForDate } from "../../api/football/services/playersService";
import { getLeagueStandings } from "../../api/football/services/standingsService";
import {
  LEAGUES,
  PRIORITY_LEAGUE_IDS,
  CURRENT_SEASON,
} from "../../api/football/constants";
import Loader from "../../layouts/loader/Loader";
import PlayerCard from "../../components/player-card/PlayerCard";

const TOP_LEAGUES = [
  { id: 200, name: "Botola Pro", country: "Maroc", season: CURRENT_SEASON },
  {
    id: 39,
    name: "Premier League",
    country: "Angleterre",
    season: CURRENT_SEASON,
  },
  { id: 140, name: "LaLiga", country: "Espagne", season: CURRENT_SEASON },
  { id: 135, name: "Serie A", country: "Italie", season: CURRENT_SEASON },
  { id: 61, name: "Ligue 1", country: "France", season: CURRENT_SEASON },
  { id: 78, name: "Bundesliga", country: "Allemagne", season: CURRENT_SEASON },
];

const TOP_TRANSFERS = [
  {
    player: "Neymar",
    from: {
      name: "Al-Hilal",
      logo: "https://media.api-sports.io/football/teams/2939.png",
    },
    to: {
      name: "Santos",
      logo: "https://media.api-sports.io/football/teams/128.png",
    },
    value: "135 M €",
    photo: "https://media.api-sports.io/football/players/276.png",
  },
  {
    player: "Luis Suárez",
    from: {
      name: "Inter Miami",
      logo: "https://media.api-sports.io/football/teams/9568.png",
    },
    to: {
      name: "Sporting KC",
      logo: "https://media.api-sports.io/football/teams/1611.png",
    },
    value: "6 M €",
    photo: "https://media.api-sports.io/football/players/184.png",
  },
  {
    player: "Raphinha",
    from: {
      name: "Leeds",
      logo: "https://media.api-sports.io/football/teams/63.png",
    },
    to: {
      name: "Barcelona",
      logo: "https://media.api-sports.io/football/teams/529.png",
    },
    value: "58 M €",
    photo: "https://media.api-sports.io/football/players/1496.png",
  },
  {
    player: "Antony",
    from: {
      name: "Man United",
      logo: "https://media.api-sports.io/football/teams/33.png",
    },
    to: {
      name: "Real Betis",
      logo: "https://media.api-sports.io/football/teams/543.png",
    },
    value: "25 M €",
    photo: "https://media.api-sports.io/football/players/9971.png",
  },
];

const isPriorityGame = (game) =>
  PRIORITY_LEAGUE_IDS.includes(Number(game.league?.id));

const leagueLogo = (id) =>
  `https://media.api-sports.io/football/leagues/${id}.png`;

const isWorldCupGroup = (group) =>
  group.id === LEAGUES.WORLD_CUP.id_v3 ||
  /world cup|coupe du monde|fifa/i.test(group.name ?? "");

const shiftDay = (date, delta) => {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
};

const isSameDay = (a, b) => gamesFormatDate(a) === gamesFormatDate(b);

const formatDateLabel = (date) => {
  if (isSameDay(date, new Date())) return "Aujourd'hui";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const formatMatchTime = (timestamp) => {
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const getScoreOrTime = (game) => {
  if (
    game?.status?.type === "finished" ||
    game?.status?.type === "inprogress"
  ) {
    const home = game.homeScore.display ?? "-";
    const away = game.awayScore.display ?? "-";
    return `${home} - ${away}`;
  }
  return formatMatchTime(game.startTimestamp);
};

const getMatchBadge = (game) => {
  if (game?.status?.type === "inprogress") return "•";
  if (game?.status?.type === "finished") return "FT";
  return null;
};

const fetchGames = async ({ queryKey }) => {
  const [, dateStr] = queryKey;
  try {
    return await getFixturesByDate(dateStr);
  } catch (error) {
    console.error("Error fetching games:", error);
    return [];
  }
};

function getQualificationBar(position) {
  if (position <= 4) return "ucl";
  if (position === 5) return "uel";
  return null;
}

function LeagueRankingsCard() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeLeague = TOP_LEAGUES[activeIndex];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["league-standings", activeLeague.id, activeLeague.season],
    queryFn: () => getLeagueStandings(activeLeague.id, activeLeague.season),
    staleTime: 5 * 60_000,
  });

  const goPrev = () =>
    setActiveIndex((i) => (i === 0 ? TOP_LEAGUES.length - 1 : i - 1));
  const goNext = () =>
    setActiveIndex((i) => (i === TOP_LEAGUES.length - 1 ? 0 : i + 1));

  const rows = data?.rows ?? [];
  const subtitle = data?.groupName ?? activeLeague.country;

  return (
    <div className={styles.standingsCard}>
      <div className={styles.standingsNav}>
        <button
          type="button"
          className={styles.standingsNavBtn}
          aria-label="Ligue précédente"
          onClick={goPrev}
        >
          <i className="fi fi-rr-angle-small-left" />
        </button>
        <div
          className={styles.standingsDots}
          role="tablist"
          aria-label="Ligues"
        >
          {TOP_LEAGUES.map((league, idx) => (
            <button
              key={league.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={league.name}
              className={`${styles.standingsDot} ${
                idx === activeIndex ? styles.standingsDotActive : ""
              }`}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.standingsNavBtn}
          aria-label="Ligue suivante"
          onClick={goNext}
        >
          <i className="fi fi-rr-angle-small-right" />
        </button>
      </div>

      <div className={styles.standingsHeader}>
        <Link
          to={`/league/${activeLeague.id}`}
          className={styles.standingsHeaderLink}
        >
          <div className={styles.standingsLeagueLogo}>
            <img src={leagueLogo(activeLeague.id)} alt="" loading="lazy" />
          </div>
          <div className={styles.standingsHeaderText}>
            <h2 className={styles.standingsTitle}>{activeLeague.name}</h2>
            <span className={styles.standingsCountry}>{subtitle}</span>
          </div>
        </Link>
      </div>

      <div className={styles.standingsTableHead}>
        <span className={styles.standingsColRank}>#</span>
        <span className={styles.standingsColTeam} />
        <span className={styles.standingsColStat}>J</span>
        <span className={styles.standingsColStat}>DB</span>
        <span className={styles.standingsColStat}>PTS</span>
      </div>

      {isLoading ? (
        <div className={styles.standingsLoading}>
          <Loader />
        </div>
      ) : isError || rows.length === 0 ? (
        <p className={styles.standingsEmpty}>Classement indisponible.</p>
      ) : (
        <ul className={styles.standingsList}>
          {rows.map((row) => {
            const bar = getQualificationBar(row.position);
            const goalDiff = row.scoresFor - row.scoresAgainst;
            const diffLabel = goalDiff > 0 ? `+${goalDiff}` : String(goalDiff);

            return (
              <li
                key={row.team?.id ?? row.position}
                className={styles.standingsRow}
              >
                {bar ? (
                  <span
                    className={`${styles.standingsBar} ${
                      bar === "ucl"
                        ? styles.standingsBarUcl
                        : styles.standingsBarUel
                    }`}
                  />
                ) : (
                  <span className={styles.standingsBarPlaceholder} />
                )}
                <span className={styles.standingsRank}>{row.position}</span>
                <img
                  src={row.team?.logo}
                  alt=""
                  className={styles.standingsTeamLogo}
                  loading="lazy"
                />
                <span
                  className={styles.standingsTeamName}
                  title={row.team?.name}
                >
                  {row.team?.name}
                </span>
                <span className={styles.standingsStat}>{row.matches}</span>
                <span className={styles.standingsStat}>{diffLabel}</span>
                <span className={styles.standingsStat}>{row.points}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function TopLeaguesCard() {
  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Meilleures ligues</h2>
      <ul className={styles.leagueList}>
        {TOP_LEAGUES.map((league) => (
          <li key={league.id} className={styles.leagueItem}>
            <Link to={`/league/${league.id}`} className={styles.leagueItemLink}>
              <img
                src={leagueLogo(league.id)}
                alt=""
                className={styles.leagueIcon}
                loading="lazy"
              />
              <span>{league.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllLeaguesCard() {
  return (
    <div className={styles.card}>
      <button type="button" className={styles.collapsibleHeader}>
        <span>Toutes les ligues</span>
        <i className="fi fi-rr-angle-small-down" />
      </button>
      <div className={styles.leagueFilter}>
        <i className="fi fi-rr-search" />
        <input
          type="text"
          placeholder="Filtres"
          aria-label="Filtrer les ligues"
        />
      </div>
    </div>
  );
}

function CenterHeader({
  date,
  setDate,
  activeFilter,
  setActiveFilter,
  search,
  setSearch,
}) {
  const filters = [
    { id: "live", label: "En cours" },
    { id: "tv", label: "À la TV" },
    { id: "time", label: "Par heure" },
  ];

  return (
    <div className={styles.card}>
      <div className={styles.dateNav}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Jour précédent"
          onClick={() => setDate(shiftDay(date, -1))}
        >
          <i className="fi fi-rr-angle-small-left" />
        </button>
        <label className={styles.datePick}>
          <span className={styles.dateLabel}>
            <span>{formatDateLabel(date)}</span>
            <i className="fi fi-rr-angle-small-down" />
          </span>
          <input
            type="date"
            className={styles.nativeDateInput}
            value={gamesFormatDate(date)}
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              const [y, m, d] = value.split("-").map(Number);
              setDate(new Date(y, m - 1, d));
            }}
            aria-label="Choisir une date"
          />
        </label>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Jour suivant"
          onClick={() => setDate(shiftDay(date, 1))}
        >
          <i className="fi fi-rr-angle-small-right" />
        </button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterPills}>
          {filters.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${styles.pill} ${
                activeFilter === id ? styles.pillActive : ""
              }`}
              onClick={() => setActiveFilter(activeFilter === id ? null : id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.searchBar}>
          <input
            type="search"
            placeholder="Rechercher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher un match"
          />
          <i className="fi fi-rr-settings-sliders" />
        </div>
      </div>
    </div>
  );
}

function MatchRow({ game }) {
  const badge = getMatchBadge(game);
  const isLive = game?.status?.type === "inprogress";

  return (
    <Link to={`/game/${game.id}`} className={styles.matchRow}>
      <div
        className={
          !badge
            ? null
            : `${styles.matchBadge} ${isLive ? styles.matchBadgeLive : ""}`
        }
        title={game?.status?.description}
      >
        {badge}
      </div>

      <div className={styles.matchTeams}>
        <span className={styles.teamName} title={game.homeTeam.name}>
          {game.homeTeam.name}
        </span>
        <img
          src={game.homeTeam.logo}
          alt=""
          className={styles.teamLogo}
          loading="lazy"
        />
        <span
          className={`${styles.matchScore} ${
            game?.status?.type === "notstarted" ? styles.matchTime : ""
          }`}
        >
          {getScoreOrTime(game)}
        </span>
        <img
          src={game.awayTeam.logo}
          alt=""
          className={styles.teamLogo}
          loading="lazy"
        />
        <span className={styles.teamName} title={game.awayTeam.name}>
          {game.awayTeam.name}
        </span>
      </div>

      {/* <div className={styles.matchActions}>
        <i className="fi fi-rr-headphones" title="Commentary" />
        <i className="fi fi-rr-screen" title="TV" />
      </div> */}
    </Link>
  );
}

function CompetitionGroup({ group, expanded, onToggle }) {
  const round = group.items[0]?.roundInfo?.round;
  const title = round ? `${group.name} ${round}` : group.name;
  const matchCount = group.items.length;
  const matchCountLabel = matchCount > 1 ? "matchs" : "match";

  return (
    <div className={styles.competitionCard}>
      <button
        type="button"
        className={`${styles.competitionHeader} ${
          isWorldCupGroup(group) ? styles.competitionHeaderWorldCup : ""
        }`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className={styles.competitionTitle}>
          {group.logo ? (
            <img
              src={group.logo}
              alt=""
              className={styles.competitionLogo}
              loading="lazy"
            />
          ) : null}
          {group.id ? (
            <Link to={`/league/${group.id}`} className={styles.competitionLink}>
              {title}
            </Link>
          ) : (
            <span>{title}</span>
          )}
        </div>
        <div className={styles.competitionHeaderActions}>
          {!expanded ? (
            <span className={styles.competitionCount}>
              {matchCount} {matchCountLabel}
            </span>
          ) : null}
          <i
            className={`fi fi-rr-angle-small-${expanded ? "up" : "down"}`}
            aria-hidden
          />
        </div>
      </button>

      {expanded ? (
        <div className={styles.matchList}>
          {group.items.map((game) => (
            <MatchRow key={game.id} game={game} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MatchSchedule({ date, activeFilter, search }) {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["landing-fixtures", gamesFormatDate(date)],
    queryFn: fetchGames,
    staleTime: 60_000,
  });

  const { highlightedGroups, restGroups } = useMemo(() => {
    let items = games;

    if (activeFilter === "live") {
      items = items.filter((g) => g?.status?.type === "inprogress");
    }

    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (g) =>
          g.homeTeam.name.toLowerCase().includes(q) ||
          g.awayTeam.name.toLowerCase().includes(q) ||
          g.league?.name?.toLowerCase().includes(q)
      );
    }

    const highlighted = items.filter(isPriorityGame);
    const highlightedIds = new Set(highlighted.map((g) => g.id));
    const rest = items.filter((g) => !highlightedIds.has(g.id));

    return {
      highlightedGroups: groupGamesByCompetition(highlighted),
      restGroups: groupGamesByCompetition(rest),
    };
  }, [games, activeFilter, search]);

  if (isLoading) return <Loader />;

  const hasHighlighted = highlightedGroups.length > 0;
  const hasRest = restGroups.length > 0;

  if (!hasHighlighted && !hasRest) {
    return (
      <div className={`${styles.card} ${styles.emptyState}`}>
        Aucun match pour cette date.
      </div>
    );
  }

  return (
    <>
      {hasHighlighted ? (
        <div className={styles.highlightedSection}>
          <p className={styles.sectionLabel}>À la une</p>
          {highlightedGroups.map((group) => (
            <CompetitionGroupWithState
              key={`highlighted-${group.key}`}
              group={group}
              defaultExpanded
            />
          ))}
        </div>
      ) : null}

      {hasRest ? (
        <div className={styles.restSection}>
          {hasHighlighted ? (
            <p className={styles.restSectionLabel}>Autres compétitions</p>
          ) : null}
          {restGroups.map((group) => (
            <CompetitionGroupWithState
              key={`rest-${group.key}`}
              group={group}
              defaultExpanded={false}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function CompetitionGroupWithState({ group, defaultExpanded = true }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <CompetitionGroup
      group={group}
      expanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
    />
  );
}

function SquadBuilderCard() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/squad-builder");
  };

  return (
    <div className={styles.squadBuilderCard} onClick={handleClick}>
      <div className={styles.squadBuilderHeader}>
        <div className={styles.squadBuilderCopy}>
          <h2 className={styles.squadBuilderTitle}>Composez votre propre 11</h2>
          <p className={styles.squadBuilderSub}>
            Essayez notre créateur de composition
          </p>
        </div>
        <div className={styles.squadBuilderIcon} aria-hidden>
          <span className={styles.squadBuilderIconGrid}>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} />
            ))}
          </span>
        </div>
      </div>

      <div className={styles.squadBuilderVisual} aria-hidden>
        <div className={styles.squadBoards}>
          <div className={`${styles.squadBoard} ${styles.squadBoardBack}`}>
            <div className={styles.squadRow}>
              <SquadSlot />
            </div>
            <div className={styles.squadRow}>
              <SquadSlot />
              <SquadSlot />
              <SquadSlot />
            </div>
          </div>

          <div className={`${styles.squadBoard} ${styles.squadBoardFront}`}>
            <div className={styles.squadRow}>
              <SquadSlot />
              <SquadSlot />
            </div>
            <div className={styles.squadRow}>
              <SquadSlot />
              <SquadSlot />
            </div>
            <div className={styles.squadRow}>
              <SquadSlot />
              <SquadSlot />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SquadSlot() {
  return (
    <div className={styles.squadSlot}>
      <div className={styles.squadAvatar}>
        <i className="fi fi-rr-user" />
      </div>
      <span className={styles.squadPlus}>+</span>
    </div>
  );
}

function MoroccanPlayersCard({ date }) {
  const { t } = useTranslation();

  const { data: enrichedGames = [], isLoading } = useQuery({
    queryKey: ["moroccanPlayers", gamesFormatDate(date)],
    queryFn: () => getMoroccanPlayersForDate(date),
    staleTime: 60_000,
  });

  return (
    <div className={styles.card}>
      <div className={styles.moroccanHeader}>
        <h2 className={styles.cardTitle}>{t("games.internationalsTitle")}</h2>
        <div className={styles.moroccanIcon}>
          <i className="fi fi-br-ma" />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.moroccanLoading}>
          <Loader />
        </div>
      ) : enrichedGames.length === 0 ? (
        <p className={styles.moroccanEmpty}>{t("games.internationalsEmpty")}</p>
      ) : (
        <ul className={styles.moroccanList}>
          {enrichedGames.map((item) => (
            <li key={item.id} className={styles.moroccanItem}>
              <Link
                to={`/game/${item.game.id}`}
                className={styles.moroccanMatchLink}
              >
                <div className={styles.moroccanMatchTeams}>
                  <img
                    src={item.game.homeTeam.logo}
                    alt=""
                    className={styles.moroccanTeamLogo}
                    loading="lazy"
                  />
                  <span className={styles.moroccanScore}>
                    {getScoreOrTime(item.game)}
                  </span>
                  <img
                    src={item.game.awayTeam.logo}
                    alt=""
                    className={styles.moroccanTeamLogo}
                    loading="lazy"
                  />
                </div>
                <p className={styles.moroccanMatchMeta}>
                  {item.game.league?.name}
                </p>
              </Link>
              <div className={styles.moroccanPlayersRow}>
                {item.moroccanPlayers.map((entry, idx) => (
                  <PlayerCard
                    key={entry.player?.id ?? idx}
                    player={entry.player}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PredictCard() {
  return (
    <div className={styles.predictCard}>
      <div className={styles.predictShapes} aria-hidden />
      <div className={styles.predictContent}>
        <span className={styles.predictLabel}>Predict</span>
        <p className={styles.predictText}>Pronostics &amp; analyses du jour</p>
      </div>
      <div className={styles.predictLogo}>
        <i className="fi fi-rr-football" />
      </div>
    </div>
  );
}

function TopTransfersCard() {
  return (
    <div className={styles.card}>
      <div className={styles.transfersHeader}>
        <div>
          <h2 className={styles.cardTitle}>Meilleurs transferts</h2>
          <span className={styles.transfersSub}>Par date</span>
        </div>
        <div className={styles.transfersIcon}>
          <i className="fi fi-rr-arrows-repeat" />
        </div>
      </div>

      <ul className={styles.transferList}>
        {TOP_TRANSFERS.map((transfer) => (
          <li key={transfer.player} className={styles.transferItem}>
            <img
              src={transfer.photo}
              alt=""
              className={styles.transferPhoto}
              loading="lazy"
            />
            <div className={styles.transferMeta}>
              <span className={styles.transferPlayer}>{transfer.player}</span>
              <div className={styles.transferClubs}>
                <img src={transfer.from.logo} alt="" loading="lazy" />
                <i className="fi fi-rr-arrow-small-right" />
                <img src={transfer.to.logo} alt="" loading="lazy" />
              </div>
            </div>
            <span className={styles.transferValue}>{transfer.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Landing() {
  const [date, setDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState(null);
  const [search, setSearch] = useState("");

  return (
    <section className={styles.page}>
      <div className={styles.grid}>
        <aside className={styles.left}>
          <LeagueRankingsCard />
          <TopLeaguesCard />
          <AllLeaguesCard />
        </aside>

        <main className={styles.center}>
          <CenterHeader
            date={date}
            setDate={setDate}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            search={search}
            setSearch={setSearch}
          />
          <MatchSchedule
            date={date}
            activeFilter={activeFilter}
            search={search}
          />
        </main>

        <aside className={styles.right}>
          <SquadBuilderCard />
          {/* <PredictCard /> */}
          <MoroccanPlayersCard date={date} />
          <TopTransfersCard />
        </aside>
      </div>
    </section>
  );
}
