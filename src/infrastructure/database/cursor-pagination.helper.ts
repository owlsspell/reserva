export interface DecodedCursor {
  id: string;
}

export function decodeCursor(cursor?: string): DecodedCursor | undefined {
  if (!cursor) return undefined;
  try {
    const jsonStr = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as DecodedCursor;
  } catch {
    return undefined;
  }
}

export function processPaginatedRecords<TRecord extends { id: string }, TDomain>(
  records: TRecord[],
  limit: number,
  toDomain: (record: TRecord) => TDomain,
): { data: TDomain[]; nextCursor: string | null } {
  const hasMore = records.length > limit;
  const data = records.slice(0, limit);
  const lastItem = data[data.length - 1];
  const nextCursor =
    hasMore && lastItem
      ? Buffer.from(JSON.stringify({ id: lastItem.id })).toString('base64')
      : null;

  return {
    data: data.map((r) => toDomain(r)),
    nextCursor,
  };
}
