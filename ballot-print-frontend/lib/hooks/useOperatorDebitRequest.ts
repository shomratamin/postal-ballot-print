import { useMutation } from "@tanstack/react-query";

// Request types
export interface OperatorDebitRequest {
    token: string;
    reference: string;
    amount: number;
    barcode: string;
}

// Response types
export interface User {
    id: number;
    username: string;
    uuid: string;
}

export interface Admin {
    id: number;
    username: string;
    uuid: string;
}

export interface AccountOwner {
    user?: User;
    admin?: Admin;
}

export interface Account {
    id: number;
    account_name: string | null;
    account_number: string;
    account_owner: AccountOwner;
}

export interface CreditLedger {
    id: number;
    amount: number;
    reference: string;
    entry_type: "credit";
    transaction_type: "credit";
    to_account: Account;
    to_account_current_balance: number;
    created_at: string;
    updated_at: string;
}

export interface DebitLedger {
    id: number;
    amount: number;
    reference: string;
    entry_type: "debit";
    transaction_type: "debit";
    from_account: Account;
    from_account_current_balance: number;
    to_account: Account;
    to_account_current_balance: number;
    created_at: string;
    updated_at: string;
}

export interface OperatorDebitData {
    credit_ledger: CreditLedger;
    debit_ledger: DebitLedger;
}

export interface OperatorDebitResponse {
    status: "success" | "failed";
    message: string;
    data: OperatorDebitData;
}

// API function
const operatorDebit = async (
    request: OperatorDebitRequest,
): Promise<OperatorDebitResponse> => {
    let url = `https://accounting.ekdak.com/api/v1/operatorDebit/`;
    // let url = `${process.env.NEXT_PUBLIC_DMS_ACCOUNT_API_URL}/api/v1/operatorDebit/`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${request.token}`,
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: OperatorDebitResponse = await response.json();
    return data;
};

// Hook
export const useOperatorDebitRequest = () => {
    return useMutation({
        mutationFn: operatorDebit
    });
};