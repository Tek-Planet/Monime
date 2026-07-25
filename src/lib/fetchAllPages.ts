/**
 * Utility to fetch all pages of a query from Supabase PostgREST,
 * overriding the default 1000 row limit per request.
 *
 * @param createQuery Function returning a fresh PostgREST query builder
 * @param pageSize Number of records per batch (default 1000)
 */
export async function fetchAllPages<T>(
  createQuery: () => any,
  pageSize = 1000
): Promise<T[]> {
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + pageSize - 1;
    const { data, error } = await createQuery().range(from, to);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = allData.concat(data as T[]);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        from += pageSize;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}
