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

export const formatNumberAsYouType = (value: string) => {
    // 1. Remove any existing commas or non-numeric chars (except dot)
    const raw = value.replace(/[^0-9.]/g, '');

    // 2. Split into integer and decimal parts
    const parts = raw.split('.');

    // 3. Format integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // 4. Rejoin. Limit to 2 decimal places if needed, or just let user type?
    // User expects to type freely, so we just join whatever they have.
    // However, prevent multiple dots (split handles this by taking first 2 parts or joining rest?)
    // Actually split will give ['1', '2', '3'] for '1.2.3'. We should only keep first dot.

    if (parts.length > 2) {
        // If multiple dots, ignore subsequent ones
        return `${parts[0]}.${parts[1]}`;
    }

    return parts.join('.');
};
