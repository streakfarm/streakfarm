function AppContent() {
  const { isLoading, isAuthenticated, authError, retryAuth } = useAuth();
  const { isTelegram, isReady, error: telegramError } = useTelegram();

  // 🔥 ADD THIS DEBUG UI
  useEffect(() => {
    console.log("🔥 AppContent state:", {
      isLoading,
      isAuthenticated,
      isTelegram,
      isReady,
      authError,
      telegramError,
    });
  }, [isLoading, isAuthenticated, isTelegram, isReady]);

  // 🔥 TEMPORARY: Force show debug info on screen
  return (
    <div style={{ 
      padding: "20px", 
      background: "#1a1a2e", 
      color: "#fff",
      minHeight: "100vh",
      fontFamily: "monospace"
    }}>
      <h2>🔧 DEBUG MODE</h2>
      <pre style={{ background: "#333", padding: "10px", borderRadius: "8px" }}>
        {JSON.stringify({
          isLoading,
          isAuthenticated,
          isTelegram,
          isReady,
          authError: authError || "null",
          telegramError: telegramError || "null"
        }, null, 2)}
      </pre>
    </div>
  );

  // ... baaki code comment kar de temporarily
}
