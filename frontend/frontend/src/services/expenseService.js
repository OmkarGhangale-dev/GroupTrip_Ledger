import api from "./api";

export const getExpenses = async (tripId) => {
  const response = await api.get(`/expenses/trip/${tripId}`);
  return response.data;
};

export const getExpense = async (expenseId) => {
  const response = await api.get(`/expenses/${expenseId}`);
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await api.post("/expenses/", expenseData);
  return response.data;
};

export const updateExpense = async (expenseId, expenseData) => {
  const response = await api.patch(
    `/expenses/${expenseId}`,
    expenseData
  );
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  await api.delete(`/expenses/${expenseId}`);
};
export const parseExpenseText = async (tripId, text) => {
  const response = await api.post("/expenses/parse", {
    trip_id: tripId,
    text,
  });
  return response.data;
};
   export const scanReceipt = async (file) => {
     const form = new FormData();
     form.append("file", file);
     const response = await api.post("/expenses/scan-receipt", form, {
       headers: { "Content-Type": "multipart/form-data" },
     });
     return response.data;
   };

   export const splitReceiptWithText = async (payload) => {
  const response = await api.post("/expenses/receipt-split", payload);
  return response.data;
};