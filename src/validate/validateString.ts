import { validateBounds } from "./validateBounds";
import { StringField } from "../Field";
import { ValidationResult } from "./Context";

const stringFilters = {
    date: /^(\d{4})-(\d{2})-(\d{2})$/,
    time: /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/,
    datetime: /^(\d{4})-(\d{2})-(\d{2})T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(Z|(\+|-)([01][0-9]|2[0-3]):([0-5][0-9]))$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    email: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    base64: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
};
export const validateString = (value: any, field: StringField, path: string[]): ValidationResult => {
    if (typeof value !== 'string') return [{ path, issue: 'value must be string.' }];

    const { of: filter } = field;

    if (filter) {
        if (typeof filter === 'string') {
            const regex = stringFilters[filter as keyof typeof stringFilters];

            if (regex && !regex.test(value))
                return [{ path, issue: `value must be a ${filter} string` }];
        }
        else if (filter instanceof RegExp) {
            if (!filter.test(value))
                return [{ path, issue: `value must match custom regex: ${filter}` }];

        }
        else {
            return [{ path, issue: `invalid string filter ${filter}` }];
        }
    }

    const boundsCheck = validateBounds(value.length, field, 'value length');

    return boundsCheck ? [{ path, issue: boundsCheck }] : true;
};
