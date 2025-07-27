import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "expenditure-service",
  brokers: [process.env.KAFKA_BROKER!],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: "expenditure-group" });

export const initKafka = async () => {
  try {
    await producer.connect();
    await consumer.connect();
    console.log("✅ Kafka producer & consumer connected");
  } catch (err) {
    console.error("❌ Kafka connection error:", err);
  }
};
