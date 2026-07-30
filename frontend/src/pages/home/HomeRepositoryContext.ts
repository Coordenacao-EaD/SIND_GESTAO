import { createContext } from "react";
import type { HomeRepository } from "./services/home.repository";

export const HomeRepositoryContext = createContext<HomeRepository | null>(null);
