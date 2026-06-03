import CODM from "../assets/logos/CODM.png";
import DHJ from "../assets/logos/DHJ.png";
import FAR from "../assets/logos/FAR.png";
import FUS from "../assets/logos/FUS.png";
import HUSA from "../assets/logos/HUSA.png";
import IRT from "../assets/logos/IRT.png";
import KACM from "../assets/logos/KACM.png";
import MAS from "../assets/logos/MAS.png";
import OCS from "../assets/logos/OCS.png";
import OD from "../assets/logos/OD.png";
import RCA from "../assets/logos/RCA.png";
import RCAZ from "../assets/logos/RCAZ.png";
import RSB from "../assets/logos/RSB.png";
import USYM from "../assets/logos/USYM.png";
import UTS from "../assets/logos/UTS.png";
import WAC from "../assets/logos/WAC.png";

export const logosLinks = [
  { id: 3453, name: "Maghreb Fès", link: MAS },
  { id: 976, name: "Raja Casablanca", link: RCA },
  { id: 969, name: "FAR Rabat", link: FAR },
  { id: 968, name: "Wydad AC", link: WAC },
  { id: 962, name: "Renaissance Berkane", link: RSB },
  { id: 964, name: "Difaa EL Jadida", link: DHJ },
  { id: 22218, name: "CODM Meknès", link: CODM },
  { id: 971, name: "Kawkab Marrakech", link: KACM },
  { id: 977, name: "FUS Rabat", link: FUS },
  { id: 974, name: "Ittihad Tanger", link: IRT },
  { id: 3449, name: "CR Khemis Zemamra", link: RCAZ },
  { id: 973, name: "Hassania Agadir", link: HUSA },
  { id: 3454, name: "Olympique Dcheïra", link: OD },
  { id: 14806, name: "UTS Rabat", link: UTS },
  { id: 25058, name: "Yacoub El Mansour", link: USYM },
  { id: 975, name: "Olympique Safi", link: OCS },
];

export function getBotolaTeamLogo(teamId) {
  return logosLinks.find((logo) => logo.id === teamId)?.link;
}

export function withBotolaTeamLogo(team) {
  if (!team) return team;
  const link = getBotolaTeamLogo(team.id);
  return link ? { ...team, logo: link } : team;
}
