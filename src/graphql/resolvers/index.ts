import { Context } from "../../context";
import { requireAuth } from "../../middlewares/auth";
import * as typescriptTypes from "../interface";
import * as spendService from "../../services/spend.service";
import * as categoryService from "../../services/category.service";
import * as paymentMethodService from "../../services/paymentMethod.service";
import * as authService from "../../services/auth.service";
import * as creditCardService from "../../services/creditCard.service";
import * as expenseService from "../../services/expense.service";
export default {
  Query: {
    getMonthlyExpenses: async (
      _: any,
      { filter }: typescriptTypes.ExpensesFilterInput,
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      return expenseService.getMonthlyExpenses(prisma, authUser.id, filter);
    },
    getSpendBreakdown: async (
      _: any,
      { filter }: { filter: { year: number } },
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      try {
        return await spendService.getSpendBreakdown(
          prisma,
          authUser.id,
          filter.year
        );
      } catch (error) {
        console.error(error);
        // Todo: use a normal errorResponse
        return {
          success: false,
          message: "Failed to fetch spend breakdown",
          monthlyCategoryBreakdown: [],
          monthlyMethodBreakdown: [],
          yearlyCategoryBreakdown: [],
          yearlyMethodBreakdown: [],
        };
      }
    },
    getTopSpendingCategories: async (
      _: any,
      { topN }: { topN: number },
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      try {
        return await categoryService.getTopSpendingCategories(
          prisma,
          authUser.id,
          topN
        );
      } catch (error) {
        console.error(error);
        return {
          success: false,
          message: "Failed to fetch top spending categories",
          data: [],
        };
      }
    },
    getTopSpendingPaymentMethods: async (
      _: any,
      { topN }: { topN: number },
      { prisma, user }: Context
    ) => {
      const authUser = requireAuth(user);
      try {
        return await paymentMethodService.getTopSpendingPaymentMethods(
          prisma,
          authUser.id,
          topN
        );
      } catch (error) {
        console.error(error);
        return {
          success: false,
          message: "Failed to fetch top spending payment methods",
          data: [],
        };
      }
    },
  },
  Mutation: {
    AddCreditCard: async (_: any, { input }: any, { prisma, user }: any) => {
      const authUser = requireAuth(user);
      return creditCardService.addCreditCard(prisma, authUser.id, input);
    },
    AddExpense: async (_: any, { input }: any, { prisma, user }: any) => {
      const authUser = requireAuth(user);
      return expenseService.addExpense(prisma, authUser.id, input);
    },
    register: async (_: any, { input }: any, { prisma }: any) => {
      return authService.register(prisma, input);
    },
    login: async (_: any, { input }: any, { prisma }: any) => {
      return authService.login(prisma, input);
    },
    AddCategory: async (_: any, { input }: any, { prisma, user }: any) => {
      requireAuth(user);
      return categoryService.addCategory(prisma, input.name);
    },
    AddPaymentMethod: async (_: any, { input }: any, { prisma, user }: any) => {
      requireAuth(user);
      return paymentMethodService.addPaymentMethod(prisma, input.name);
    },
  },
};