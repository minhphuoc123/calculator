export function formatCurrency(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value);
}

export function parseCurrencyInput(value: string) {
    const onlyDigits = value.replace(/[^\d]/g, "");
    return onlyDigits ? Number(onlyDigits) : 0;
}