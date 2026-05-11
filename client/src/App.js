import React, { useState } from "react";
import { Container, Navbar, Offcanvas } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CarList from "./features/cars/components/CarList";
import HomeList from "./features/homes/components/HomeList";
import TravelList from "./features/travel/components/TravelList";
import ConcertList from "./features/concerts/components/ConcertList";
import EventList from "./features/events/components/EventList";
import ActivityList from "./features/activities/components/ActivityList";
import CellarList from "./features/cellar/components/CellarList";
import KidsList from "./features/kids/components/KidsList";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import Snaps from "./pages/Snaps";
import Settings from "./pages/Settings";
import SharedFeed from "./pages/SharedFeed";
import Recommendations from "./pages/Recommendations";
import InviteWelcome from "./pages/InviteWelcome";
import MyPeople from "./pages/MyPeople";
import MyMilestones from "./pages/MyMilestones";
import TravelStatsPage from "./pages/TravelStatsPage";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import SidebarNav from "./components/shared/SidebarNav";
import MigrationBanner from "./components/auth/MigrationBanner";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";
import { useAuth } from "./contexts/AuthContext";
import "App.css";

function AppShell() {
  const [showMobileNav, setShowMobileNav] = useState(false);
  const { counts, notifications } = useAppData();

  return (
    <Router>
      {/* Desktop sidebar (lg+) */}
      <aside className="app-sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="sidebar-brand-emoji">📸</span>
          <span className="sidebar-brand-name">LifeSnaps</span>
        </Link>
        <SidebarNav counts={counts} notificationCount={notifications.length} />
      </aside>

      {/* Mobile navbar (below lg) */}
      <Navbar
        className="d-lg-none"
        style={{
          backgroundColor: "var(--color-sidebar-bg)",
          position: "sticky",
          top: 0,
          zIndex: 1040,
        }}
      >
        <Container fluid>
          <Navbar.Brand
            as={Link}
            to="/"
            style={{ fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}
          >
            📸 LifeSnaps
          </Navbar.Brand>
          <button
            className="btn btn-link p-0"
            onClick={() => setShowMobileNav(true)}
            aria-label="Open navigation"
            style={{ fontSize: "1.5rem", lineHeight: 1, color: "rgba(255,255,255,0.85)" }}
          >
            &#9776;
          </button>
        </Container>
      </Navbar>

      {/* Mobile offcanvas nav */}
      <Offcanvas
        show={showMobileNav}
        onHide={() => setShowMobileNav(false)}
        placement="start"
        style={{
          width: "280px",
          backgroundColor: "var(--color-sidebar-bg)",
        }}
      >
        <Offcanvas.Header
          closeButton
          closeVariant="white"
          style={{ borderBottom: "1px solid var(--color-sidebar-border)" }}
        >
          <Offcanvas.Title
            style={{
              fontWeight: 700,
              color: "#fff",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.5px",
            }}
          >
            📸 LifeSnaps
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ padding: 0 }}>
          <SidebarNav
            counts={counts}
            notificationCount={notifications.length}
            onItemClick={() => setShowMobileNav(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main content area -- offset on desktop when sidebar is present */}
      <main className="app-main-with-sidebar">
        <Container className="py-4">
          <MigrationBanner />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/snaps" element={<Snaps />} />
            <Route path="/cars" element={<CarList />} />
            <Route path="/homes" element={<HomeList />} />
            <Route path="/travel" element={<TravelList />} />
            <Route path="/travel/stats" element={<TravelStatsPage />} />
            <Route path="/activities" element={<ActivityList />} />
            <Route path="/concerts" element={<ConcertList />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/cellar" element={<CellarList />} />
            <Route path="/kids" element={<KidsList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/shared" element={<SharedFeed />} />
            <Route path="/people" element={<MyPeople />} />
            <Route path="/milestones" element={<MyMilestones />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/invite/:token" element={<InviteWelcome />} />
          </Routes>
        </Container>
      </main>
    </Router>
  );
}

function App() {
  const { user, loading, isRecovering } = useAuth();

  // While Supabase resolves the session, render nothing to avoid flash
  if (loading) return null;

  // Unauthenticated users see only the login page
  if (!user) return <Login />;

  // Users who clicked a password-reset link land here before setting a new password
  if (isRecovering) return <ResetPassword />;

  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}

export default App;
