function AppRoutes() {
  const { user, isLoading } = useAuth();

  // TEMPORARY - Skip auth check for testing
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/badges" element={<Badges />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
