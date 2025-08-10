import dotenv from "dotenv";
dotenv.config();
import { ApolloServer } from "apollo-server";
import typeDefs from "./graphql/schema";
import resolvers from "./graphql/resolvers";
import { createContext } from "./context";

export async function startServer() {
  // await initKafka(); // ✅ Kafka connects
  // redis.connect();   // ✅ Redis connects

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext,
    cors: { origin: "*", credentials: true },
  });
  const { url } = await server.listen({ port: 4000 });
  /* eslint-disable-next-line no-console */
  console.log(`🚀 GraphQL ready at ${url}`);
}
