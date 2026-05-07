import React, { useState } from "react";
import { Container, Navbar, Offcanvas } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CarList from "features/cars/components/CarList";
import HomeList from "features/homes/components/HomeList";
import TravelList from "features/travel/components/TravelList";
import ConcertList from "features/concerts/components/ConcertList";
import Dashboard from "pages/Dashboard";
import Timeline from "pages/Timeline";
import Snaps from "pages/Snaps";
import SidebarNav from "components/shared/SidebarNav";
import dataService from "services/dataService";
import "App.css";

function App() {
  const [showMobileNav, setShowMobileNav] = useState(false);

  const counts = dataService.getCounts();

  return (
    <Router>
      {/* Desktop sidebar (lg+) */}
      <aside className="app-sidebar">
        <Link to="/" className="sidebar-brand">
          Snaps
        </Link>
        <SidebarNav counts={counts} />
      </aside>

      {/* Mobile navbar (below lg) */}
      <Navbar
        bg="dark"
        variant="dark"
        className="d-lg-none"
        style={{ position: "sticky", top: 0, zIndex: 1040 }}
      >
        <Container fluid>
          <Navbar.Brand as={Link} to="/" style={{ fontWeight: 700 }}>
            Snaps
          </Navbar.Brand>
          <button
            className="btn btn-link text-white p-0"
            onClick={() => setShowMobileNav(true)}
            aria-label="Open navigation"
            style={{ fontSize: "1.5rem", lineHeight: 1 }}
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
        style={{ width: "280px" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title style={{ fontWeight: 700 }}>Snaps</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SidebarNav
            counts={counts}
            onItemClick={() => setShowMobileNav(false)}
          />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main content area -- offset on desktop when sidebar is present */}
      <main className="app-main-with-sidebar">
        <Container className="py-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/snaps" element={<Snaps />} />
            <Route path="/cars" element={<CarList />} />
            <Route path="/homes" element={<HomeList />} />
            <Route path="/travel" element={<TravelList />} />
            <Route path="/concerts" element={<ConcertList />} />
          </Routes>
        </Container>
      </main>
    </Router>
  );
}

export default App;
