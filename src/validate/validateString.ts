import { StringSchema, StringFormat } from "../Schema";
import { RegexString } from "../util";
import { ValidationResult } from "./Context";
import { isStringFormat } from "./StringFormat";
import { Issue } from "./Result";
import { validateBounds } from "./validateBounds";

type StringTester = (value: string, path: string[]) => ValidationResult;

const daysOfMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const validateDateParts = (year: string, month: string, day: string, path: string[], issues: Issue[]) => {
    const yearInt = parseInt(year, 10);
    const monthInt = parseInt(month, 10);
    const dayInt = parseInt(day, 10);

    if (monthInt < 1 || monthInt > 12) {
        issues.push({ path, issue: 'value must have month between 01 and 12' });
    }
    else {
        const leapDay = (monthInt === 2 && (yearInt % 400 === 0 || (yearInt % 100 !== 0 && yearInt % 4 === 0)) ? 1 : 0);

        const monthDays = daysOfMonth[monthInt - 1] + leapDay;

        // console.log({ yearInt, monthInt, dayInt, monthDays, leapDay });

        if (dayInt < 1 || dayInt > monthDays)
            issues.push({ path, issue: `value must have day between 01 and ${monthDays}}` });
    }

    return issues;
};

const validateTimeParts = (
    hour: string,
    minute: string,
    second: string,
    millisecond: string | undefined,
    path: string[], issues: Issue[]
) => {
    const hourInt = parseInt(hour, 10);
    const minuteInt = parseInt(minute, 10);
    const secondInt = parseInt(second, 10);
    const millisecondInt = millisecond ? parseInt(millisecond, 10) : 0;

    if (hourInt < 0 || hourInt > 23)
        issues.push({ path, issue: 'value must have hours between 00 and 23' });
    if (minuteInt < 0 || minuteInt > 59)
        issues.push({ path, issue: 'value must have minutes between 00 and 59' });
    if (secondInt < 0 || secondInt > 59)
        issues.push({ path, issue: 'value must have seconds between 00 and 59' });
    if (millisecondInt < 0 || millisecondInt > 999)
        issues.push({ path, issue: 'value must have milliseconds between 00 and 99' });
    return issues;
};

const tzRegex = /([+-])(\d{2}):(\d{2})/;

const validateTimeZone = (part: string, path: string[], issues: Issue[]) => {
    if (part !== 'Z') {

        const [, sign, hours, minutes] = part.match(tzRegex) ?? [];

        const hoursInt = parseInt(hours, 10);

        const minutesInt = parseInt(minutes, 10);

        if (hoursInt > 23)
            issues.push({ path, issue: 'value must have timezone hours between 00 and 23' });
        else if (minutesInt > 59) {
            issues.push({ path, issue: 'value must have timezone minutes between 00 and 59' });
        }
    };

    return issues;
};

const dateRegex = /^(\d{4})-(\d{2})-(\d{2})/;

const dateTester: StringTester = (value, path) => {
    const match = value.match(dateRegex);

    if (!match)
        return [{ path, issue: 'value must be in date format YYYY-MM-DD' }];

    const [, year, month, day] = match;

    const issues = validateDateParts(year, month, day, path, []);

    return issues.length ? issues : true;
};


const timeRegex = /^(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?$/;

const timeTester: StringTester = (value, path) => {

    const match = value.match(timeRegex);

    if (!match)
        return [{ path, issue: 'value must be in time format HH:mm:ss(.nnn)' }];

    const [, hour, minute, second, millisecond] = match;

    const issues = validateTimeParts(hour, minute, second, millisecond, path, []);

    return issues.length ? issues : true;
};

const datetimeTester: StringTester = (value, path) => {
    let regex = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?((?:[+-]\d{2}(?:\:?\d{2})?)|Z)?$/;

    let [match, year, month, day, hour, minute, second, millisecond, timezone] = value.match(regex) ?? [];

    if (!match)
        return [{ path, issue: 'value must be in datetime format HH:mm:ss(.nnn)Thh:MM:SS(.nnn)(+-hh(:mm)|Z)' }];

    let issues = validateDateParts(year, month, day, path, []);

    issues = validateTimeParts(hour, minute, second, millisecond, path, issues);

    if (timezone)
        issues = validateTimeZone(timezone, path, issues);

    return issues.length ? issues : true;
};

// UUID: 8-4-4-4-12
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const uuidTester: StringTester = (value, path) => {
    return uuidRegex.test(value) ? true : [{ path, issue: 'value must be a valid uuid' }];
};

const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

const base64Tester: StringTester = (value, path) => {
    return base64Regex.test(value) ? true : [{ path: path, issue: 'value must be valid base64 encoded string' }];
};

const emailRegex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

const emailTester: StringTester = (value, path) => {
    return emailRegex.test(value) ? true : [{ path: path, issue: 'value must be a valid email' }];
};


const stringTesters: Record<StringFormat, StringTester> = {
    date: dateTester,
    time: timeTester,
    datetime: datetimeTester,
    uuid: uuidTester,
    base64: base64Tester,
    email: emailTester
};

export const validateString = (value: any, schema: StringSchema, path: string[], prefix: string = 'value'): ValidationResult => {
    if (typeof value !== 'string') return [{ path, issue: `${prefix} must be string.` }];

    const { of: filter } = schema;

    if (filter) {
        if (typeof filter === 'string') {
            if (isStringFormat(filter)) {
                const tester = stringTesters[filter];

                if (tester) {
                    const result = tester(value, path);

                    if (result !== true) return result;
                }
            }
            else {
                const regex = RegexString.toRegExp(filter);

                if (regex) {
                    if (!regex.test(value))
                        return [{ path, issue: `${prefix}  must match custom regex: ${regex}` }];
                }
                else {
                    return [{ path, issue: `invalid ${prefix} string filter: ${filter}` }];
                }
            }
        }
        else if (filter instanceof RegExp) {
            if (!filter.test(value))
                return [{ path, issue: `${prefix}  must match custom regex: ${filter}` }];

        }
        else {
            return [{ path, issue: `invalid ${prefix} string filter ${filter}` }];
        }
    }

    const boundsCheck = validateBounds(value.length, schema, `${prefix} length`);

    return boundsCheck ? [{ path, issue: boundsCheck }] : true;
};
