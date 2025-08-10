import { redis } from "../redis/client";

export const setCache = async (
  key: string,
  value: JSON | string,
  expiry?: number
) => {
  try {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);
    if (expiry) {
      await redis.set(key, stringValue, "EX", expiry);
    } else {
      await redis.set(key, stringValue);
    }
  } catch (error) {
    throw new Error("Error setting value in cache: " + error);
  }
};

export const getCache = async (key: string) => {
  try {
    const value = await redis.get(key);
    if (!value) {return null;}

    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (error) {
    throw new Error(`${error}`);
    console.error(error);
  }
};

export const deleteCache = async (key: string) => {
  try {
    await redis.del(key);
  } catch (error) {
    throw new Error("Error deleting entry: " + error);
  }
};

export const hasCache = async (key: string) => {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    throw new Error("Error Checking if key exists: " + error);
  }
};

export const deleteKeysByPattern = async (pattern: string) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

export const setHash = async (
  key: string,
  data: Record<string, string>
): Promise<void> => {
  await redis.hmset(key, data);
};

export const getHash = async (key: string): Promise<Record<string, string>> => {
  return await redis.hgetall(key);
};

export const getHashField = async (
  key: string,
  field: string
): Promise<string | null> => {
  return await redis.hget(key, field);
};

export const deleteHashField = async (
  key: string,
  field: string
): Promise<void> => {
  await redis.hdel(key, field);
};

export const addToSortedSet = async (
  key: string,
  score: number,
  member: string
): Promise<void> => {
  await redis.zadd(key, score, member);
};

export const getSortedSetRange = async (
  key: string,
  start: number,
  stop: number
): Promise<string[]> => {
  return await redis.zrange(key, start, stop);
};

export const getSortedSetRevRange = async (
  key: string,
  start: number,
  stop: number
): Promise<string[]> => {
  return await redis.zrevrange(key, start, stop);
};

export const getSortedSetScore = async (
  key: string,
  member: string
): Promise<string | null> => {
  return await redis.zscore(key, member);
};

export const removeFromSortedSet = async (
  key: string,
  member: string
): Promise<void> => {
  await redis.zrem(key, member);
};

export const publish = async (
  channel: string,
  message: string
): Promise<void> => {
  await redis.publish(channel, message);
};

export const pushToList = async (key: string, value: string): Promise<void> => {
  await redis.lpush(key, value);
};

export const popFromList = async (key: string): Promise<string | null> => {
  return await redis.rpop(key);
};

export const getListRange = async (
  key: string,
  start: number,
  end: number
): Promise<string[]> => {
  return await redis.lrange(key, start, end);
};

export const setTTL = async (key: string, expiry: number): Promise<void> => {
  await redis.expire(key, expiry);
};