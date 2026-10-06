import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070b14",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          padding: 24,
          textAlign: "center"
        }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>🤖</div>
          <h2 style={{ marginBottom: 8 }}>AI Companion Needs a Quick Refresh</h2>
          <p style={{ color: "#94a3b8", maxWidth: 440, marginBottom: 20 }}>
            An unexpected render state occurred. Click below to reload your desktop companion.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reload Companion
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
