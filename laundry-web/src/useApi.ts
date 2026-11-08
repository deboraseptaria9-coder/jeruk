import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "./api/client";

/**
 * Hook sederhana untuk GET data dari API:
 * - data     : hasil response
 * - loading  : true saat request berjalan
 * - error    : pesan error (mis. server mati)
 * - reload() : panggil ulang (dipakai setelah POST/PUT/DELETE)
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
