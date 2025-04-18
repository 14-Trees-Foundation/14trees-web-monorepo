export function slug(title: string) {
  return title.toLowerCase().replace(/ /g, "-");
}

export const getUniqueRequestId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}