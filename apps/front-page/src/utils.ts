export function slug(title: string) {
  return title.toLowerCase().replace(/ /g, "-");
}