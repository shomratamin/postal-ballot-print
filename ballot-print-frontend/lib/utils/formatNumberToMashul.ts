
export const formatNumber = (num: number): string => {
    // Convert the number to a string with fixed two decimal places
    const fixedNumber = num.toFixed(2);

    // Split the number into the integer part and decimal part
    const [integerPart, decimalPart] = fixedNumber.split('.');

    // Pad the integer part with leading zeros if necessary to ensure at least 5 digits
    const paddedIntegerPart = integerPart.padStart(5, '0');

    // Combine the padded integer part and the decimal part
    return `${paddedIntegerPart}.${decimalPart}`;
};