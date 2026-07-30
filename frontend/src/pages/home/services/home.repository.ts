import type { HomePageData } from "../types/home.types";

/**
 * Abstraction the Home page depends on. Swapping the active implementation
 * (mock today, HTTP later) never requires touching a visual component.
 */
export interface HomeRepository {
  getHomePage(): Promise<HomePageData>;
}
