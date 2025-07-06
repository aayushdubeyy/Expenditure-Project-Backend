import { startServer } from "./app";

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
