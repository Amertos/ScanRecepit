export const formatCurrency = (amount: number, currency: string | undefined | null): string => {
    const symbol = currency || 'USD'; // Default to 'USD' if currency is not available
    
    // For common symbols that typically precede the number
    if (['$', '€', '£'].includes(symbol)) {
        return `${symbol}${amount.toFixed(2)}`;
    }

    // For ISO codes or other symbols, place them after the number with a space
    return `${amount.toFixed(2)} ${symbol}`;
};
