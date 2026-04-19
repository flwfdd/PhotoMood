type ClassValue = string | undefined | null | false | ClassValue[]

function flattenClasses(classes: ClassValue[]): string[] {
  return classes.flatMap((c) => {
    if (!c) return []
    if (Array.isArray(c)) return flattenClasses(c)
    return [c]
  })
}

export function cn(...classes: ClassValue[]): string {
  return flattenClasses(classes).join(' ')
}
