import { assertScript, playbackError } from './assert';

export interface MapRange {
    value: string;
    min: number | null;
    max: number | null;
}

export function prepareRanges(rawRanges: MapRange[]): MapRange[] {
    const ranges = rawRanges.map(rng => {
        assertScript(rng.value, 'Range output value is required');
        return {
            value: rng.value,
            min: rng.min == null || String(rng.min) === '' ? null : parseInt(String(rng.min), 10),
            max: rng.max == null || String(rng.max) === '' ? null : parseInt(String(rng.max), 10),
        };
    }).sort((a, b) => ((a.min || -Infinity) < (b.min || -Infinity) ? -1 : 1));
    // Validate overlapping ranges
    for (let i = 1; i < ranges.length; i += 1) {
        const rng = ranges[i];
        const prevRng = ranges[i - 1];
        const overlap =
            rng.min == null || // only first min can be Infinity
            prevRng.max == null || // only last max can be Infinity
            rng.min < prevRng.max; // ranges overlap
        assertScript(!overlap, 'Ranges may not overlap');
    }
    return ranges;
}

export function mapRange(ranges: MapRange[], value: number) {
    for (const range of prepareRanges(ranges)) {
        const satMin = range.min == null || value >= range.min;
        const satMax = range.max == null || value < range.max;
        if (satMin && satMax) {
            return range.value;
        }
    }
    throw playbackError(`Value ${value} is not covered by the ranges`);
}
