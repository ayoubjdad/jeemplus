import axios from "axios";
import { standingsUrls } from "./data";
import { botolaRanking } from "../data/static/botolaRanking";

/** Botola total standings tables — same payload Ranking uses (`data[0].rows`). */
export async function fetchBotolaStandingsTables() {
  // const response = await axios.get(standingsUrls[0]);
  // return response?.data?.standings || [];
  return botolaRanking?.standings || [];
}
