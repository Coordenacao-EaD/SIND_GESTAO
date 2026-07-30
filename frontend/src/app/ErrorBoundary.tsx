import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last-resort safety net for render-time errors that escape a section's own
 * try/catch (e.g. a bug in a component, not a data-fetch failure — those are
 * handled per-section by SectionError). Logs to console only; never shows a
 * technical message to the user.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unexpected UI error captured by ErrorBoundary:", error, info);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper} role="alert">
          <h1 className={styles.title}>Algo não saiu como esperado</h1>
          <p className={styles.description}>
            Ocorreu um erro inesperado ao exibir esta página. Você pode tentar novamente.
          </p>
          <button type="button" className={styles.action} onClick={this.handleReload}>
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
