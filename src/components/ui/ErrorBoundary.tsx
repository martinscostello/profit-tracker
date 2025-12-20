import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
                    <h1 style={{ color: "red" }}>Something went wrong.</h1>
                    <p>Please check your configuration.</p>
                    <pre style={{ backgroundColor: "#f3f4f6", padding: "1rem", borderRadius: "0.5rem", overflow: "auto" }}>
                        {this.state.error?.message}
                    </pre>
                    <p>If this is a Firebase error, ensure your <code>.env.local</code> file is set up correctly and the server was restarted.</p>
                </div>
            );
        }

        return this.props.children;
    }
}
