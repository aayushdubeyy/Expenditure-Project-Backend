import { ApolloServer } from "apollo-server";
import typeDefs from "./graphql/schema";
import resolvers from "./graphql/resolvers";
import redis from "./redis";
import { initKafka } from "./kafka";

export async function startServer() {
  await initKafka(); // ✅ Kafka connects
  redis.connect();   // ✅ Redis connects

  const server = new ApolloServer({ typeDefs, resolvers });
  const { url } = await server.listen({ port: 4000 });
  console.log(`🚀 GraphQL ready at ${url}`);
}
