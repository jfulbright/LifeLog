// client/src/utils/suppressResizeObserverWarning.js

// Only suppress in development
if (process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("ResizeObserver loop")
    ) {
      return; // Suppress this warning
    }
    originalConsoleError(...args);
  };
}
