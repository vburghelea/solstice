import { crawlStartPlayingSystems } from "~/features/game-systems/crawler/startplaying";

const startPlayingPage = Number(process.env["STARTPLAYING_PAGE"] ?? "0");
const startUrl =
  startPlayingPage > 0
    ? `https://startplaying.games/play/game-systems?page=${startPlayingPage}`
    : undefined;

await crawlStartPlayingSystems(startUrl);
