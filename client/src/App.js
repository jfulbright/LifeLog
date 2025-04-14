import React from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import CarList from "features/cars/components/CarList";
import HomeList from "features/homes/components/HomeList";
import TravelList from "features/travel/components/TravelList";
import ConcertList from "features/concerts/components/ConcertList";
import "App.css";

function App() {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/">
            LifeLog
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/cars">
              Cars
            </Nav.Link>
            <Nav.Link as={Link} to="/homes">
              Homes
            </Nav.Link>
            <Nav.Link as={Link} to="/travel">
              Travel
            </Nav.Link>
            <Nav.Link as={Link} to="/concerts">
              Concerts
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container>
        <Routes>
          <Route
            path="/"
            element={<h2>Welcome to LifeLog — Track Your Homes and Cars!</h2>}
          />
          <Route path="/cars" element={<CarList />} />
          <Route path="/homes" element={<HomeList />} />
          <Route path="/travel" element={<TravelList />} />
          <Route path="/concerts" element={<ConcertList />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
