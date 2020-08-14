import { FuzzyMatchOptions, fuzzyMatch } from './match';

/**
 * Fuzzy search candidates using fuzzy match algorithm (see `fuzzyMatch`).
 * The results are sorted by score in descending order, with references to source strings.
 *
 * @param query Search string.
 * @param sources Array of strings to search in.
 * @param options Match options.
 */
export function fuzzySearch(
    query: string,
    sources: string[],
    options: FuzzyMatchOptions = {}
): FuzzySearchResult[] {
    const results: FuzzySearchResult[] = [];
    for (const [sourceIndex, source] of sources.entries()) {
        const match = fuzzyMatch(query, source, options);
        if (match.score > 0) {
            results.push({
                score: match.score,
                matches: match.matches,
                source,
                sourceIndex,
            });
        }
    }
    return results.sort((a, b) => {
        // I'm sorry for this, really.
        return a.score === b.score ?
            (a.source > b.source ? 1 : -1) :
            a.score > b.score ? -1 : 1;
        // (but hey, it just means "order by score desc, text asc")
    });
}

/**
 * Fuzzy earch result.
 */
export interface FuzzySearchResult {
    /**
     * Matching score (higher — more relevant, 0 — no match)
     */
    score: number;
    /**
     * Indices of characters that matched your query (for highlighting)
     */
    matches: number[];
    /**
     * Source string (candidate) that matched.
     */
    source: string;
    /**
     * An index of the source string in an initial array.
     */
    sourceIndex: number;
}
