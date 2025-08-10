import { getCache, setCache } from "../utils/redis";
import { redisKeys, redisExpiryTime } from "../redis/constants";
import { successResponse } from "../utils/response";

export const getSpendBreakdown = async (
  prisma: any,
  userId: string,
  year: number
) => {
  const cacheKey = `${redisKeys.SPEND_BREAKDOWN}${userId}:${year}`;
  let cached = await getCache(cacheKey);

  if (cached) {
    const parsed = JSON.parse(cached);
    return successResponse(parsed, "Spend breakdown fetched successfully (from cache)");
  }

  const data: any = await getSpendBreakdown(prisma, userId, year);
  await setCache(cacheKey, JSON.stringify(data), redisExpiryTime.SEVEN_DAYS);

  return successResponse(data, "Spend breakdown fetched successfully");
};
