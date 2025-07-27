export interface RegisterInput {
  input: {
    name: string;
    email: string;
    password: string;
  };
}
type UserInput = {
  name: string;
  email: string;
  password: string;
};
export interface AddCreditCardInput {
  input: {
    name: string;
    limit: number;
    billCycleDay: number;
  };
}

export interface AddExpenseInput {
  input: {
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

export interface LoginInput {
  input: Omit<RegisterInput["input"], "name">;
}

export interface ExpensesFilterInput {
  filter?: {
    month?: number;
    year?: number;
    paymentMethodId?: number;
  };
}

export interface AddCategoryInput {
  input: {
    name: string;
  };
}

export interface AddPaymentMethodInput {
  input: {
    name: string;
  };
}
