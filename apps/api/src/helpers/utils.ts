export const removeSpecialCharacters = function (str: string) {
    return str.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
}