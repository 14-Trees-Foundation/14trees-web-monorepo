export function changeCase(str: string, format: "camel" | "pascal" = "camel"): string {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, '') // Remove special characters
    .split(' ')
    .map((word, index) => {
      if (index === 0 && format === 'camel') {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}
