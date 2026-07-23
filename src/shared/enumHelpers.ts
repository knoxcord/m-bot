export const isEnumValue = <T extends Record<string, string>>(
    value: string,
    enumObj: T,
): value is T[keyof T] =>
    (Object.values(enumObj) as string[]).includes(value);
