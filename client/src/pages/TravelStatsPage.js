import React, { useState, useEffect } from "react";
import { Row, Col, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import dataService from "../services/dataService";
import { computeTravelStats } from "../services/travelStats";
import WorldMapView from "../features/travel/components/WorldMapView";
import { codeToFlag, CONTINENT_LABELS } from "../data/countries";

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "1.25rem",
      textAlign: "center",
      borderTop: `3px solid ${color || "var(--color-travel)"}`,
    }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: color || "var(--color-travel)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, marginTop: "0.25rem", color: "var(--color-text-primary)" }}>{label}</div>
      {sub && <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, value, max, color, suffix = "" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {value} / {max}{suffix}
        </span>
      </div>
      <div style={{ background: "var(--color-border)", borderRadius: 6, height: 10 }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: color || "var(--color-travel)",
          borderRadius: 6,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.2rem" }}>
        {pct}%
      </div>
    </div>
  );
}

function BarChart({ data, color }) {
  if (!data || Object.keys(data).length === 0) return null;
  const maxVal = Math.max(...Object.values(data));
  const years = Object.keys(data).sort();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem", height: 80 }}>
      {years.map((year) => {
        const val = data[year];
        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
        return (
          <div key={year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", fontWeight: 600 }}>{val}</div>
            <div style={{
              width: "100%",
              height: `${Math.max(4, pct)}%`,
              background: color || "var(--color-travel)",
              borderRadius: "3px 3px 0 0",
              minHeight: 4,
            }} />
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>{year}</div>
          </div>
        );
      })}
    </div>
  );
}

function SectionHeader({ children, emoji }) {
  return (
    <div className="d-flex align-items-center gap-2 mb-3" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem" }}>
      {emoji && <span>{emoji}</span>}
      <h5 className="mb-0" style={{ fontWeight: 700 }}>{children}</h5>
    </div>
  );
}

function TravelStatsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);

  useEffect(() => {
    dataService.getItems("travel").then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-tertiary)" }}>
        Loading your travel story…
      </div>
    );
  }

  const stats = computeTravelStats(items);
  const hasData = stats.totalTrips > 0;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0" style={{ fontWeight: 700 }}>✈️ Travel Stats</h4>
          <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "0.2rem" }}>
            Your world, by the numbers
          </div>
        </div>
        <Link to="/travel" className="btn btn-sm btn-outline-secondary">
          ← Back to Trips
        </Link>
      </div>

      {!hasData ? (
        <div style={{
          textAlign: "center",
          padding: "3rem 2rem",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--card-radius)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
          <h5 style={{ fontWeight: 700 }}>Your travel story starts here</h5>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Log your first visited trip to see stats about where you've been.
          </p>
          <Link to="/travel" className="btn btn-primary btn-sm">Add a Trip</Link>
        </div>
      ) : (
        <>
          {/* Hero stats row */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <StatCard label="Countries" value={stats.visitedCountryCount} sub={`of ${stats.totalCountries} · ${stats.percentOfWorld}% of world`} color="var(--color-travel)" />
            </Col>
            <Col xs={6} md={3}>
              <StatCard label="Continents" value={stats.visitedContinentCount} sub="of 6 major continents" color="var(--color-events)" />
            </Col>
            <Col xs={6} md={3}>
              <StatCard label="Cities" value={stats.visitedCityCount} sub="unique cities visited" color="var(--color-success)" />
            </Col>
            <Col xs={6} md={3}>
              <StatCard label="Days Traveling" value={stats.totalDays} sub={`across ${stats.totalTrips} trips`} color="var(--color-warning)" />
            </Col>
          </Row>

          {/* This year callout */}
          {stats.tripsThisYear > 0 && (
            <div style={{
              background: "linear-gradient(135deg, #EAF8FE 0%, #F5EEF8 100%)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--card-radius)",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
            }}>
              <div style={{ fontWeight: 700, color: "var(--color-text-secondary)", fontSize: "var(--font-size-xs)", textTransform: "uppercase", letterSpacing: "0.05em", alignSelf: "center" }}>
                {stats.currentYear} so far
              </div>
              <div><span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-travel)" }}>{stats.tripsThisYear}</span> <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>trips</span></div>
              <div><span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-events)" }}>{stats.countriesThisYear}</span> <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>countries</span></div>
              <div><span style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-success)" }}>{stats.daysThisYear}</span> <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>days away</span></div>
            </div>
          )}

          {/* World Map */}
          <div className="mb-4">
            <SectionHeader emoji="🗺️">Your World Map</SectionHeader>
            <WorldMapView
              items={items}
              onCountryClick={({ code, name, data }) => {
                setSelectedCountry({ code, name, trips: data?.trips || [] });
              }}
            />
            {selectedCountry && (
              <div style={{
                marginTop: "1rem",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--card-radius)",
                padding: "1rem 1.25rem",
              }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 style={{ fontWeight: 700, margin: 0 }}>
                    {codeToFlag(selectedCountry.code)} {selectedCountry.name}
                    <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: "0.5rem", fontSize: "var(--font-size-sm)" }}>
                      {selectedCountry.trips.length} trip{selectedCountry.trips.length !== 1 ? "s" : ""}
                    </span>
                  </h6>
                  <button type="button" onClick={() => setSelectedCountry(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1rem", color: "var(--color-text-tertiary)" }}>×</button>
                </div>
                {selectedCountry.trips.map((trip, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", fontSize: "var(--font-size-sm)" }}>
                    <Badge bg={trip.status === "visited" ? "success" : "warning"} className={trip.status === "wishlist" ? "text-dark" : ""}>
                      {trip.status}
                    </Badge>
                    <span style={{ fontWeight: 600 }}>{trip.title || trip.city || "Trip"}</span>
                    {trip.city && <span style={{ color: "var(--color-text-tertiary)" }}>{trip.city}</span>}
                    {trip.startDate && <span style={{ color: "var(--color-text-tertiary)" }}>· {new Date(trip.startDate + "T00:00:00").getFullYear()}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress bars */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <div className="card p-3">
                <SectionHeader emoji="📊">Progress</SectionHeader>
                <ProgressBar
                  label="Countries visited"
                  value={stats.visitedCountryCount}
                  max={stats.totalCountries}
                  color="var(--color-travel)"
                />
                <ProgressBar
                  label="Continents visited"
                  value={stats.visitedContinentCount}
                  max={6}
                  color="var(--color-events)"
                />
                {stats.wishlistCountryCount > 0 && (
                  <ProgressBar
                    label="Wishlist countries explored"
                    value={stats.visitedCountries.filter((c) =>
                      stats.wishlistCountries?.some((w) => w.code === c.code)
                    ).length}
                    max={stats.wishlistCountryCount}
                    color="var(--color-warning)"
                    suffix=" from wishlist"
                  />
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="card p-3">
                <SectionHeader emoji="📅">Trips by Year</SectionHeader>
                {Object.keys(stats.tripsByYear).length > 0 ? (
                  <BarChart data={stats.tripsByYear} color="var(--color-travel)" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>No dated trips yet.</p>
                )}
              </div>
            </Col>
          </Row>

          {/* Highlights row */}
          <Row className="g-3 mb-4">
            {stats.mostVisitedCountry && (
              <Col xs={12} sm={6} md={3}>
                <div className="card p-3 text-center h-100">
                  <div style={{ fontSize: "2rem" }}>{codeToFlag(stats.mostVisitedCountry.code)}</div>
                  <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>Most Visited</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
                    {stats.mostVisitedCountry.name} · {stats.mostVisitedCountry.count}x
                  </div>
                </div>
              </Col>
            )}
            {stats.favoriteMonth && (
              <Col xs={12} sm={6} md={3}>
                <div className="card p-3 text-center h-100">
                  <div style={{ fontSize: "2rem" }}>📅</div>
                  <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>Favorite Month</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{stats.favoriteMonth}</div>
                </div>
              </Col>
            )}
            {stats.avgTripDays > 0 && (
              <Col xs={12} sm={6} md={3}>
                <div className="card p-3 text-center h-100">
                  <div style={{ fontSize: "2rem" }}>⏱️</div>
                  <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>Avg Trip Length</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{stats.avgTripDays} days</div>
                </div>
              </Col>
            )}
            {stats.internationalRatio > 0 && (
              <Col xs={12} sm={6} md={3}>
                <div className="card p-3 text-center h-100">
                  <div style={{ fontSize: "2rem" }}>🌐</div>
                  <div style={{ fontWeight: 700, marginTop: "0.25rem" }}>International</div>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{stats.internationalRatio}% of trips</div>
                </div>
              </Col>
            )}
          </Row>

          {/* Continents + Companions */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <div className="card p-3">
                <SectionHeader emoji="🌍">Countries by Continent</SectionHeader>
                {Object.entries(stats.continentBreakdown).map(([cont, countries]) => (
                  <div key={cont} className="mb-3">
                    <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", marginBottom: "0.4rem", color: "var(--color-text-secondary)" }}>
                      {CONTINENT_LABELS[cont]} ({countries.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {countries.map(({ code, name }) => (
                        <span key={code} style={{
                          background: "var(--color-surface-hover)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                          padding: "0.15rem 0.5rem",
                          fontSize: "var(--font-size-xs)",
                          fontWeight: 600,
                        }}>
                          {codeToFlag(code)} {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {Object.keys(stats.continentBreakdown).length === 0 && (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>No country data yet.</p>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="card p-3">
                <SectionHeader emoji="👥">Top Travel Companions</SectionHeader>
                {stats.topCompanions.length > 0 ? (
                  stats.topCompanions.map(({ name, count }, i) => (
                    <div key={name} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginBottom: "0.625rem",
                      padding: "0.5rem 0",
                      borderBottom: i < stats.topCompanions.length - 1 ? "1px solid var(--color-border)" : "none",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "var(--color-travel)",
                        color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: "var(--font-size-sm)",
                      }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                          {count} trip{count !== 1 ? "s" : ""} together
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--color-travel)", fontSize: "var(--font-size-lg)" }}>{count}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>
                    Add companions to your trips to see who you travel with most.
                  </p>
                )}
              </div>
            </Col>
          </Row>

          {/* Wishlist */}
          {stats.wishlistCountryCount > 0 && (
            <div className="card p-3 mb-4">
              <SectionHeader emoji="💛">Bucket List Countries ({stats.wishlistCountryCount})</SectionHeader>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {stats.wishlistCountries.map(({ code, name }) => (
                  <span key={code} style={{
                    background: "#FFFBEA",
                    border: "1px solid #ECB22E",
                    borderRadius: 12,
                    padding: "0.2rem 0.6rem",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "#7a5800",
                  }}>
                    {codeToFlag(code)} {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TravelStatsPage;
