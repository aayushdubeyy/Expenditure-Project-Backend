import { PrismaClient } from "../../generated/prisma";
import * as creditCardRepo from "../repository/creditCard.repository";
import { successResponse } from "../utils/response";

export const addCreditCard = async (prisma: PrismaClient, userId: string, input: any) => {
  const { name, limit, billCycleDay } = input;
  const newCard = await creditCardRepo.createCreditCard(prisma, {
    userId,
    name,
    limit,
    billCycleDay,
  });
  return successResponse(newCard, "Credit card added successfully");
};
