import axios from "axios";

export const fetchWithProxy = async (url) => {
  try {
    const response = await axios.get("/api/proxy", {
      params: { url },
    });
    return response.data;
  } catch (error) {
    console.error("Proxy fetch error:", error);
    return {};
  }
};
