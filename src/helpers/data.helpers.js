import axios from "axios";
import { newsUrl, serverUrl } from "../api/config";

export const fetchNews = async () => {
  const response = await axios.get(newsUrl);
  return response.data;
};

export const fetchImages = async () => {
  try {
    const response = await axios.get(serverUrl + "/api/images");
    return response.data.images;
  } catch (error) {
    console.error("❌ Error fetching images:", error);
  }
};

export const saveArticle = async (data) => {
  try {
    await axios.post(newsUrl, data);
  } catch (error) {
    console.error("❌ Error saving article:", error);
  }
};

export const deleteArticle = async (id) => {
  axios.delete(`${newsUrl}/${id}`);
};
