import { useCallback, useState } from "react";

export default function useAsyncState(initialData = []) {
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    error: "",
    data: initialData,
  });

  const start = useCallback((refreshing = false) => {
    setState((current) => ({
      ...current,
      loading: !refreshing,
      refreshing,
      error: "",
    }));
  }, []);

  const succeed = useCallback((data) => {
    setState({
      loading: false,
      refreshing: false,
      error: "",
      data,
    });
  }, []);

  const fail = useCallback((error) => {
    setState((current) => ({
      ...current,
      loading: false,
      refreshing: false,
      error: error?.message || "Something went wrong",
    }));
  }, []);

  return { state, start, succeed, fail, setState };
}
