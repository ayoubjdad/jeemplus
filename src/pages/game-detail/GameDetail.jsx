import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getSofascoreApiV1Base } from "../../api/sofascoreBase";
import Loader from "../../layouts/loader/Loader";
import Team from "../../components/team/Team";
import { palette } from "../../themes/palette";
import styles from "./GameDetail.module.scss";

const fetchEvent = async (eventId) => {
  const base = getSofascoreApiV1Base();
  const { data } = await axios.get(`${base}/event/${eventId}`);
  return data?.event ?? null;
};

const formatKickoff = (timestamp) => {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function GameDetail() {
  const { eventId } = useParams();

  const {
    data: event,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["sofa-event", eventId],
    queryFn: () => fetchEvent(eventId),
    enabled: Boolean(eventId),
  });

  if (isLoading) return <Loader />;

  if (isError || !event) {
    return (
      <section className={styles.page}>
        <Link className={styles.back} to="/">
          ← Retour
        </Link>
        <p className={styles.error}>
          {error?.message || "Impossible de charger ce match."}
        </p>
      </section>
    );
  }

  const statusType = event.status?.type;
  const isLive = statusType === "inprogress";
  const isFinished = statusType === "finished";

  const homeScore =
    isFinished || isLive ? event.homeScore?.display ?? "—" : null;
  const awayScore =
    isFinished || isLive ? event.awayScore?.display ?? "—" : null;

  return (
    <section className={styles.page}>
      <Link className={styles.back} to="/">
        ← Retour
      </Link>

      <div className={styles.meta}>
        <span className={styles.tournament}>
          {event.tournament?.uniqueTournament?.name ||
            event.tournament?.name}
        </span>
        {event.season?.name ? (
          <span className={styles.dot}>·</span>
        ) : null}
        {event.season?.name ? (
          <span>{event.season.name}</span>
        ) : null}
        {event.roundInfo?.round != null ? (
          <>
            <span className={styles.dot}>·</span>
            <span>Journée {event.roundInfo.round}</span>
          </>
        ) : null}
      </div>

      <div className={styles.statusRow}>
        <span
          className={styles.statusPill}
          style={{
            borderColor: isLive ? palette?.red?.main : palette.gray.main,
            color: isLive ? palette?.red?.main : palette.gray.main,
          }}
        >
          {event.status?.description || event.status?.type || "—"}
        </span>
        <span className={styles.kickoff}>{formatKickoff(event.startTimestamp)}</span>
      </div>

      <div className={styles.scoreboard}>
        <div className={styles.side}>
          <Team team={event.homeTeam} fromGame />
          <p className={styles.teamFull}>{event.homeTeam?.name}</p>
        </div>

        <div className={styles.centerScore}>
          {homeScore != null && awayScore != null ? (
            <p className={styles.scoreLine}>
              <span>{homeScore}</span>
              <span className={styles.scoreSep}>—</span>
              <span>{awayScore}</span>
            </p>
          ) : (
            <p className={styles.vs}>vs</p>
          )}
          {(isFinished || isLive) &&
          event.homeScore?.period1 != null &&
          event.awayScore?.period1 != null ? (
            <p className={styles.half}>
              Mi-temps {event.homeScore.period1}–{event.awayScore.period1}
            </p>
          ) : null}
        </div>

        <div className={styles.side}>
          <Team team={event.awayTeam} fromGame />
          <p className={styles.teamFull}>{event.awayTeam?.name}</p>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        {event.venue?.name ? (
          <div className={styles.detail}>
            <h3>Stade</h3>
            <p>{event.venue.name}</p>
            {event.venue.city?.name ? (
              <p className={styles.muted}>{event.venue.city.name}</p>
            ) : null}
            {event.venue.capacity ? (
              <p className={styles.muted}>
                Capacité {event.venue.capacity.toLocaleString()}
              </p>
            ) : null}
          </div>
        ) : null}

        {event.referee?.name ? (
          <div className={styles.detail}>
            <h3>Arbitre</h3>
            <p>{event.referee.name}</p>
          </div>
        ) : null}

        {event.homeTeam?.manager?.name ? (
          <div className={styles.detail}>
            <h3>Entraîneur ({event.homeTeam.shortName})</h3>
            <p>{event.homeTeam.manager.name}</p>
          </div>
        ) : null}

        {event.awayTeam?.manager?.name ? (
          <div className={styles.detail}>
            <h3>Entraîneur ({event.awayTeam.shortName})</h3>
            <p>{event.awayTeam.manager.name}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
