function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const { isTelegram, isReady } = useTelegram();

  // UNCOMMENT THESE LINES
  if (isLoading || !isReady) {
    return <SplashScreen />;
  }

  if (!isTelegram && !isAuthenticated) {
    return <SplashScreen showTelegramPrompt />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ... routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
