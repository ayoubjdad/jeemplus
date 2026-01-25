import axios from "axios";

export const handler = async () => {
  const { data } = await axios.get(
    "https://www.sofascore.com/api/v1/unique-tournament/937/season/78750/standings/total",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
