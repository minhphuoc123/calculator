export type PackageKey = "VSAT" | "AIO" | "CCTV" | "AV";

export type PackageInput = {
    output: number;
    input: number;
    recordDate: string;
    note: string;
};

export type PackageResult = {
    output: number;
    input: number;
    grossProfit: number;
    vat: number;
    corporateTax: number;
    netProfit: number;
};

export type PackageTypeItem = {
    id: string;
    code: string;
    name: string;
};

export type CreateRecordPayload = {
    packageTypeId: string;
    recordDate: string;
    revenueBeforeVat: number;
    costBeforeVat: number;
    note?: string;
};

export type FinancialRecordItem = {
    id: string;
    recordDate: string;
    revenueBeforeVat: number;
    costBeforeVat: number;
    grossProfit?: number;
    vatAmount?: number;
    corporateTaxAmount?: number;
    netProfit?: number;
    note?: string | null;
    createdAt?: string;
    packageType?: {
        id: string;
        code: string;
        name: string;
    };
};