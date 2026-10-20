import { onRequest as weatherHandler } from "./functions/uapi/weather.js";
import { onRequest as songHandler } from "./functions/api/song.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/uapi/weather" || url.pathname === "/uapi/weather/") {
      return weatherHandler({ request, env });
    }
    if (url.pathname === "/api/song" || url.pathname === "/api/song/") {
      return songHandler({ request, env });
    }
    return env.ASSETS.fetch(request);
  },
};
