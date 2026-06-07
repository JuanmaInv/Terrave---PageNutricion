export interface MockSupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export function createSupabaseClientMock<T>(response: MockSupabaseResponse<T>) {
  return {
    from() {
      return {
        select: async () => response,
        insert: async () => response,
        update: async () => response,
      };
    },
  };
}
