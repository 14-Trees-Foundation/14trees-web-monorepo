export const removeSpecialCharacters = function (str: string) {
    return str.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
}

export const isValidDateString = (str: string) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
        return false;
    }

    return true;
}