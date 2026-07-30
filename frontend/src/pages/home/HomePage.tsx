import { useHomePage } from "./hooks/useHomePage";
import { HomeLayout } from "./HomeLayout";
import { SectionError, SectionLoading } from "./components/SectionState";
import styles from "./HomePage.module.css";

/**
 * Route-level component for "/". Resolves data through useHomePage (which
 * reads the HomeRepository injected by the nearest HomeDataProvider) and
 * hands the fully-loaded payload to HomeLayout for rendering.
 */
export function HomePage() {
  const { state, retry } = useHomePage();

  if (state.status === "loading") {
    return (
      <main id="conteudo" className={styles.pageState}>
        <SectionLoading label="Carregando a Página Inicial..." />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main id="conteudo" className={styles.pageState}>
        <SectionError message={state.message} onRetry={retry} />
      </main>
    );
  }

  return (
    <main id="conteudo">
      <HomeLayout data={state.data} onRetrySection={retry} />
    </main>
  );
}
