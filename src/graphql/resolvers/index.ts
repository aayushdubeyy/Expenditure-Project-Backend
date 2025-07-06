import { Context } from "../../context";
import { errorResponse, successResponse } from "../../utils/response";
import { AddCreditCardInput, AddExpenseInput, RegisterInput } from "../interface";
import bcrypt from "bcrypt";

export default {
    Query: {
        hello: () => "Hello from expenditure backend"
    },
    Mutation: {
        AddCreditCard: async(_: any, { input } : AddCreditCardInput, { prisma }: Context) => {
            const { userId, name, limit, billCycleDay } = input;
            const newCard = await prisma.creditCard.create({
                data: {
                    userId,
                    name,
                    limit,
                    billCycleDay
                }
            })
            return successResponse(newCard, "Credit card added successfully");
        },
        AddExpense:  async (_: any, { input }: AddExpenseInput, { prisma }: Context) => {
            const { userId, title, amount, categoryId, paymentMethodId, creditCardId, date, notes } = input;
            const newExpense = await prisma.expense.create({
                data: {
                    userId,
                    title,
                    amount,
                    categoryId,
                    paymentMethodId,
                    creditCardId,
                    date: new Date(date),
                    notes
                }
            });
            return successResponse(newExpense, "Expense added successfully");
        },
        register: async(_ : any, { input } : RegisterInput, { prisma }: Context) => {
            const { name, email, password } = input;
            const existingUser = await prisma.user.findUnique({where: {email}});
            if (existingUser) {
                return errorResponse("User already exists");
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword
                }
            });
            return successResponse(user, "User registered successfully");
        }
    }

}