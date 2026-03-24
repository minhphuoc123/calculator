export type FinancialRecordPayload = {
    packageType: string;
    recordDate: string;
    output: number;
    input: number;
    grossProfit: number;
    vat: number;
    corporateTax: number;
    netProfit: number;
};

export type FinancialRecord = FinancialRecordPayload & {
    id: string;
    createdAt: string;
    updatedAt: string;
};