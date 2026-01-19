import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import Index from '@/pages/Index';
import Boxes from '@/pages/Boxes';
import Badges from '@/pages/Badges';
import Tasks from '@/pages/Tasks';
import Profile from '@/pages/Profile';
import Leaderboard from '@/pages/Leaderboard';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/NotFound';

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <Index />
            </PageTransition>
          }
        />
        <Route
          path="/boxes"
          element={
            <PageTransition>
              <Boxes />
            </PageTransition>
          }
        />
        <Route
          path="/badges"
          element={
            <PageTransition>
              <Badges />
            </PageTransition>
          }
        />
        <Route
          path="/tasks"
          element={
            <PageTransition>
              <Tasks />
            </PageTransition>
          }
        />
        <Route
          path="/profile"
          element={
            <PageTransition>
              <Profile />
            </PageTransition>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PageTransition>
              <Leaderboard />
            </PageTransition>
          }
        />
        <Route
          path="/admin"
          element={
            <PageTransition>
              <Admin />
            </PageTransition>
          }
        />
        <Route
          path="*"
          element={
            <PageTransition>
              <NotFound />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}
