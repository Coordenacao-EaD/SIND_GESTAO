import type { HomePageData } from "../types/home.types";
import {
  homePageDataEmptyDocumentsMock,
  homePageDataEmptyNewsMock,
  homePageDataEmptyNoticesMock,
  homePageDataMock,
  homePageDataPartialErrorMock,
} from "../mocks/home.mock";
import type { HomeRepository } from "./home.repository";

export type HomeMockScenario =
  | "default"
  | "empty-news"
  | "empty-notices"
  | "empty-documents"
  | "partial-error";

const SCENARIOS: Record<HomeMockScenario, HomePageData> = {
  default: homePageDataMock,
  "empty-news": homePageDataEmptyNewsMock,
  "empty-notices": homePageDataEmptyNoticesMock,
  "empty-documents": homePageDataEmptyDocumentsMock,
  "partial-error": homePageDataPartialErrorMock,
};

/**
 * Demonstrative implementation of HomeRepository. Resolves instantly with
 * static mock data — no network, no storage. The `scenario` parameter exists
 * so tests and manual QA can exercise every UI state without touching the
 * visual components.
 */
export class HomeMockRepository implements HomeRepository {
  constructor(private readonly scenario: HomeMockScenario = "default") {}

  async getHomePage(): Promise<HomePageData> {
    return SCENARIOS[this.scenario];
  }
}
