import { describe, it, expect } from 'vitest';
import { isString, getIntValue, getBooleanValue, buildUrl } from './utils';

describe('isString', () => {
    it('returns true for a string', () => expect(isString('hello')).toBe(true));
    it('returns true for an empty string', () => expect(isString('')).toBe(true));
    it('returns false for a number', () => expect(isString(42)).toBe(false));
    it('returns false for null', () => expect(isString(null)).toBe(false));
    it('returns false for undefined', () => expect(isString(undefined)).toBe(false));
    it('returns false for an object', () => expect(isString({})).toBe(false));
    it('returns false for an array', () => expect(isString([])).toBe(false));
    it('returns false for a boolean', () => expect(isString(true)).toBe(false));
});

describe('getIntValue', () => {
    it('passes a number through unchanged', () => expect(getIntValue(42)).toBe(42));
    it('parses a string integer', () => expect(getIntValue('42')).toBe(42));
    it('truncates a decimal string', () => expect(getIntValue('3.9')).toBe(3));
    it('returns NaN for null', () => expect(getIntValue(null)).toBeNaN());
    it('returns NaN for undefined', () => expect(getIntValue(undefined)).toBeNaN());
    it('returns NaN for a non-numeric string', () => expect(getIntValue('abc')).toBeNaN());
    it('returns NaN for an object', () => expect(getIntValue({})).toBeNaN());
});

describe('getBooleanValue', () => {
    it('returns true for "1"', () => expect(getBooleanValue('1')).toBe(true));
    it('returns true for "true"', () => expect(getBooleanValue('true')).toBe(true));
    it('returns true for "TRUE"', () => expect(getBooleanValue('TRUE')).toBe(true));
    it('returns false for "0"', () => expect(getBooleanValue('0')).toBe(false));
    it('returns false for "false"', () => expect(getBooleanValue('false')).toBe(false));
    it('returns false for "FALSE"', () => expect(getBooleanValue('FALSE')).toBe(false));
    it('returns false for an arbitrary string', () => expect(getBooleanValue('maybe')).toBe(false));
    it('coerces a truthy non-string', () => expect(getBooleanValue(1)).toBe(true));
    it('coerces a falsy non-string', () => expect(getBooleanValue(0)).toBe(false));
    it('coerces null to false', () => expect(getBooleanValue(null)).toBe(false));
});

describe('buildUrl', () => {
    const base = 'http://example.com';

    it('builds a URL with the given path', () => {
        const url = buildUrl('/foo', undefined, undefined, base);
        expect(url.pathname).toBe('/foo');
    });

    it('appends query parameters', () => {
        const url = buildUrl('/foo', { key: 'val', other: '123' }, undefined, base);
        expect(url.searchParams.get('key')).toBe('val');
        expect(url.searchParams.get('other')).toBe('123');
    });

    it('sets the hash fragment', () => {
        const url = buildUrl('/foo', undefined, 'section', base);
        expect(url.hash).toBe('#section');
    });

    it('combines path, params and hash', () => {
        const url = buildUrl('/page', { q: 'wine' }, 'top', base);
        expect(url.pathname).toBe('/page');
        expect(url.searchParams.get('q')).toBe('wine');
        expect(url.hash).toBe('#top');
    });

    it('returns a URL instance', () => {
        expect(buildUrl('/x', undefined, undefined, base)).toBeInstanceOf(URL);
    });
});
