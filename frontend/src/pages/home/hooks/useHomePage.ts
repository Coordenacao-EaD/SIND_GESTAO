import { useCallback, useContext, useEffect, useState } from "react";
import { HomeRepositoryContext } from "../HomeRepositoryContext";
import type { UIState } from "../types/home.types";

export interface UseHomePageResult {
  state: UIState;
  retry: () => void;
}

/**
 * Loads Home page data through the injected HomeRepository. Knows nothing
 * about mocks, HTTP, or layout — only the loading/error/ready lifecycle.
 */
export function useHomePage(): UseHomePageResult {
  const repository = useContext(HomeRepositoryContext);
  const [state, setState] = useState<UIState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!repository) {
      setState({
        status: "error",
        message: "Nenhum repositório de dados foi configurado para a Página Inicial.",
      });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    repository
      .getHomePage()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Não foi possível carregar a Página Inicial no momento.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repository, attempt]);

  return { state, retry };
}
