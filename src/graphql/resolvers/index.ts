import moment from "moment";
import { Context } from "../../context";
import { requireAuth } from "../../middlewares/auth";
import { generateToken } from "../../utils/jwt";
import {
  errorResponse,
  loginErrorResponse,
  loginSuccessResponse,
  successResponse,
} from "../../utils/response";
import {
  AddCreditCardInput,
  AddExpenseInput,
  ExpensesFilterInput,
  LoginInput,
  RegisterInput,
} from "../interface";
import bcrypt from "bcrypt";

export default {
  Query: {
    getMonthlyExpenses: async (_: any, { filter } : ExpensesFilterInput, { prisma, user} : Context) => {
      const authUser = requireAuth(user);
      const now = moment();
      const month = filter?.month || now.month() + 1; // moment months are 0-indexed
      const year = filter?.year || now.year();
      
      const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
      const endDate = moment(startDate).endOf('month').toDate();

      const whereClause: any = {
        userId: authUser.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if(filter?.paymentMethodId) {
        whereClause.paymentMethodId = filter.paymentMethodId;
      }

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        orderBy: {
          date: 'desc',
        },
        include: {
          category: true,
          paymentMethod: true,
          creditCard: true,
        },
      })
      return expenses.map(expense => ({
        ...expense,
        date: moment(expense.date).format('YYYY-MM-DD'),
      }));
    }
  },
  Mutation: {
    AddCreditCard: async (
      _: any,
      { input }: AddCreditCardInput,
      { prisma, user }: Context
    ) => {
        const authUser = requireAuth(user);
      const { name, limit, billCycleDay } = input;
      const newCard = await prisma.creditCard.create({
        data: {
          userId: authUser.id,
          name,
          limit,
          billCycleDay,
        },
      });
      return successResponse(newCard, "Credit card added successfully");
    },
    AddExpense: async (
      _: any,
      { input }: AddExpenseInput,
      { prisma, user }: Context
    ) => {
          const authUser = requireAuth(user);
      const {
        title,
        amount,
        categoryId,
        paymentMethodId,
        creditCardId,
        date,
        notes,
      } = input;
      const newExpense = await prisma.expense.create({
        data: {
          userId: authUser.id,
          title,
          amount,
          categoryId,
          paymentMethodId,
          creditCardId,
          date: new Date(date),
          notes,
        },
      });
      return successResponse(newExpense, "Expense added successfully");
    },
    register: async (_: any, { input }: RegisterInput, { prisma }: Context) => {
      const { name, email, password } = input;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return loginErrorResponse("User already exists");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });
      const token = generateToken({ id: user.id, email: user.email });
      return loginSuccessResponse(token, { id: user.id, email: user.email });
    },
    login: async (_: any, { input }: LoginInput, { prisma }: Context) => {
    const { email, password } = input;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return loginErrorResponse("User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return loginErrorResponse("Invalid password");
    }
    const token = generateToken({ id: user.id, email: user.email });
    return loginSuccessResponse(token, { id: user.id, email: user.email });
  },
  },
  
};
