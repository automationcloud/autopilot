export function partitionBy<T, K>(items: T[], keyFn: (item: T) => K): T[][] {
    const partitions = [];
    let lastPartition: T[] | null = null;
    let lastKey: any = null;
    for (const item of items) {
        const key = keyFn(item);
        if (lastPartition && lastKey === key) {
            lastPartition.push(item);
        } else {
            lastPartition = [item];
            lastKey = key;
            partitions.push(lastPartition);
        }
    }
    return partitions;
}
