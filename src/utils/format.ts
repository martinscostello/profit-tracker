export const formatCurrency = (amount: number, currency = 'NGN', locale = 'en-NG', minimumFractionDigits = 0) => {
    let code = currency;
    // Map common symbols to ISO 4217 codes
    if (code === '₦') code = 'NGN';
    if (code === '$') code = 'USD';
    if (code === '€') code = 'EUR';
    if (code === '£') code = 'GBP';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: minimumFractionDigits,
        }).format(amount);
    } catch (e) {
        // Fallback if code is still invalid
        return `${currency}${amount.toLocaleString(locale, { minimumFractionDigits })}`;
    }
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};
