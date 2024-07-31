import { SizedAttributes } from "../Schema";


export const validateBounds = (value: number, schema: SizedAttributes, prefix: string): string | undefined => {
    const { xmin, min, xmax, max, exact } = schema;

    let messages: string[] = [];

    if (exact)
        return `${prefix} must be exactly ${exact}`;

    if (xmin !== undefined && value <= xmin)
        messages.push(`> ${xmin}`);
    else if (min !== undefined && value < min)
        messages.push(`≥ ${min}`);


    if (xmax !== undefined && value >= xmax)
        messages.push(`< ${xmax}`);
    else if (max !== undefined && value > max)
        messages.push(`≤ ${max}`);


    if (messages.length === 0)
        return undefined;
    else if (messages.length === 1)
        return `${prefix} must be ${messages[0]}.`;

    else
        return `${prefix} must be ${messages[0]} and ${messages[1]}.`;
};
