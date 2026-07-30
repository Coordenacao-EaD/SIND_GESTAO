import type { HomePageData } from "../types/home.types";
import type { HomeRepository } from "./home.repository";

/**
 * Extension point for the future backend integration (Módulo de conteúdo
 * institucional). Intentionally unimplemented in this phase — the frontend
 * ships with HomeMockRepository as the only active data source.
 *
 * When the API is ready, implement `getHomePage` here (fetch the endpoint,
 * map the DTO into HomePageData) and swap the repository instantiated in
 * HomeDataProvider. No visual component needs to change.
 */
export class HomeHttpRepository implements HomeRepository {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  getHomePage(): Promise<HomePageData> {
    throw new Error(
      `HomeHttpRepository is not implemented yet. Configured baseUrl: ${this.baseUrl}`,
    );
  }
}
