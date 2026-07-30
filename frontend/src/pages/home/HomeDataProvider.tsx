import { useMemo, type ReactNode } from "react";
import type { HomeRepository } from "./services/home.repository";
import { HomeMockRepository } from "./services/home.mock.repository";
import { HomeRepositoryContext } from "./HomeRepositoryContext";

interface HomeDataProviderProps {
  /**
   * Repository injected for this subtree. Defaults to HomeMockRepository —
   * the only active data source in this phase. Tests (or a future
   * feature flag) can pass any other HomeRepository implementation here
   * without the visual components knowing the difference.
   */
  repository?: HomeRepository;
  children: ReactNode;
}

export function HomeDataProvider({ repository, children }: HomeDataProviderProps) {
  const resolvedRepository = useMemo(
    () => repository ?? new HomeMockRepository(),
    [repository],
  );

  return (
    <HomeRepositoryContext.Provider value={resolvedRepository}>
      {children}
    </HomeRepositoryContext.Provider>
  );
}
