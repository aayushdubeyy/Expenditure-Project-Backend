export interface RegisterInput {
  input: {
    name: string;
    email: string;
    password: string;
  };
}

export interface AddCreditCardInput {
  input: {
    userId: string;
    name: string;
    limit: number;
    billCycleDay: number;
  };
}

export interface AddExpenseInput {
  input: {
    userId: string;
    title: string;
    amount: number;
    categoryId: number;
    paymentMethodId: number;
    creditCardId?: string;
    date: string;
    notes?: string;
  };
}

export type MutationResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};