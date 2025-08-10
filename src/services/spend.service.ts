import { getCache, setCache } from "../utils/redis";
import { redisKeys, redisExpiryTime } from "../redis/constants";
import { getSpendBreakdownFunction } from "./spendBreakdown.service";
import { PrismaClient } from "../../generated/prisma";
export const getSpendBreakdown = async (
  prisma: PrismaClient,
  userId: string,
  year: number
) => {
  const cacheKey = `${redisKeys.SPEND_BREAKDOWN}${userId}:${year}`;
  let cached = await getCache(cacheKey);

  if (cached) {
    return {
      success: true,
      message: "Spend breakdown fetched successfully (from cache)",
      monthlyCategoryBreakdown: cached.monthlyCategoryBreakdown || [],
      monthlyMethodBreakdown: cached.monthlyMethodBreakdown || [],
      yearlyCategoryBreakdown: cached.yearlyCategoryBreakdown || [],
      yearlyMethodBreakdown: cached.yearlyMethodBreakdown || [],
    };
  }

  const data: any = await getSpendBreakdownFunction(prisma, userId, year);
  await setCache(cacheKey, JSON.stringify(data), redisExpiryTime.SEVEN_DAYS);

  return {
    success: true,
    message: "Spend breakdown fetched successfully",
    monthlyCategoryBreakdown: data.monthlyCategoryBreakdown || [],
    monthlyMethodBreakdown: data.monthlyMethodBreakdown || [],
    yearlyCategoryBreakdown: data.yearlyCategoryBreakdown || [],
    yearlyMethodBreakdown: data.yearlyMethodBreakdown || [],
  };
};
