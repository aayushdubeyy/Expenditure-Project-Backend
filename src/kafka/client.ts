import { Kafka } from "kafkajs";

export const kafka = new Kafka({
    clientId: 'expenditure-service',
    brokers: [process.env.KAFKA_BROKER!]
});