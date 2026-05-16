import React, { useState, useEffect, useMemo } from "react";
import { Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import dataService from "../../../services/dataService";
import { computeMovieStats } from "../../../services/movieStats";
import CategoryListHeader from "../../../components/shared/CategoryListHeader";

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius)",
      padding: "1.25rem",
      textAlign: "center",
      borderTop: `3px solid ${color || "var(--color-movies, #E91E63)"}`,
    }}>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: color || "var(--color-movies, #E91E63)", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontWeight: 600, marginTop: "0.25rem", color: "var(--color-text-primary)" }}>{label}</div>
      {sub && <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

function HorizontalBar({ items, color, maxVal }) {
  if (!items || items.length === 0) return null;
  const max = maxVal || Math.max(...items.map((i) => i.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {items.map((item) => (
        <div key={item.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ minWidth: 90, fontSize: "var(--font-size-sm)", fontWeight: 600, textAlign: "right" }}>
            {item.name}
          </span>
          <div style={{ flex: 1, background: "var(--color-border)", borderRadius: 4, height: 18, position: "relative" }}>
            <div style={{
              width: `${max > 0 ? (item.count / max) * 100 : 0}%`,
              height: "100%",
              background: color || "var(--color-movies, #E91E63)",
              borderRadius: 4,
              transition: "width 0.5s ease",
            }} />
          </div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", minWidth: 20 }}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarChart({ data, color }) {
  if (!data || Object.keys(data).length === 0) return null;
  const maxVal = Math.max(...Object.values(data));
  const keys = Object.keys(data).sort();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.4rem", height: 80 }}>
      {keys.map((key) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
          <div style={{
            width: "100%",
            maxWidth: 32,
            height: maxVal > 0 ? `${(data[key] / maxVal) * 100}%` : 0,
            background: color || "var(--color-movies, #E91E63)",
            borderRadius: "4px 4px 0 0",
            minHeight: data[key] > 0 ? 4 : 0,
            transition: "height 0.5s ease",
          }} />
          <span style={{ fontSize: "0.6rem", color: "var(--color-text-tertiary)", marginTop: 4 }}>{key}</span>
        </div>
      ))}
    </div>
  );
}

function MovieStatsPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const data = await dataService.getItems("movies");
      setMovies(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const period = periodFilter === "all" ? "all" : periodFilter.split(":")[1] || "all";
  const stats = useMemo(() => computeMovieStats(movies, period), [movies, period]);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)" }}>Loading stats...</div>;
  }

  return (
    <>
      <CategoryListHeader
        title={"\u{1F3AC} Movie Stats"}
        addLabel="\u2190 Movies"
        onAdd={() => navigate("/movies")}
        stats={movies.length > 0 ? [
          { value: stats.totalWatched, label: "watched", color: "var(--color-movies, #E91E63)" },
          { value: stats.avgRating.toFixed(1), label: "avg rating" },
          { value: stats.genresExplored, label: "genres" },
          { value: stats.watchedThisYear, label: "this year" },
        ] : null}
        filterGroups={[
          {
            key: "period",
            label: "\u{1F4C5} Period",
            options: [
              { value: "period:year", label: "This Year" },
              { value: "period:all", label: "All Time" },
              { value: "period:6mo", label: "Last 6 Months" },
            ],
          },
        ]}
        filterValue={periodFilter}
        onFilterChange={setPeriodFilter}
        filterColor="var(--color-movies, #E91E63)"
      />

      {movies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-movies, #E91E63)", color: "#fff" }}>
            {"\u{1F3AC}"}
          </div>
          <div className="empty-state-title">No movie data yet</div>
          <div className="empty-state-text">Watch some movies and come back for insights.</div>
        </div>
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}><StatCard label="Watched" value={stats.totalWatched} /></Col>
            <Col xs={6} md={3}><StatCard label="Watchlist" value={stats.totalWatchlist} color="var(--color-text-secondary)" /></Col>
            <Col xs={6} md={3}><StatCard label="Avg Rating" value={stats.avgRating.toFixed(1)} sub={`of ${stats.totalWatched} rated`} /></Col>
            <Col xs={6} md={3}><StatCard label="Genres" value={stats.genresExplored} sub="explored" /></Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Genre Breakdown</h6>
                <HorizontalBar items={stats.genreBreakdown.slice(0, 8)} />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Rating Distribution</h6>
                <BarChart
                  data={stats.ratingDistribution}
                  color="var(--color-movies, #E91E63)"
                />
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Movies by Year Watched</h6>
                <BarChart
                  data={stats.watchedByYear}
                  color="var(--color-movies, #E91E63)"
                />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Decade Distribution</h6>
                <HorizontalBar
                  items={Object.entries(stats.decadeFreq).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)}
                  color="#9C27B0"
                />
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Top Directors</h6>
                {stats.topDirectors.length > 0 ? (
                  <HorizontalBar items={stats.topDirectors.slice(0, 6)} color="#FF5722" />
                ) : (
                  <div style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Add directors to your movies to see this.</div>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Movie Companions</h6>
                {stats.topCompanions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {stats.topCompanions.map((c) => (
                      <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)" }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: "var(--color-text-secondary)" }}>{c.count} movies</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Tag companions to see this.</div>
                )}
              </div>
            </Col>
          </Row>

          {stats.recommendedWatched > 0 && (
            <Row className="g-4 mb-4">
              <Col md={6}>
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                  <h6 style={{ fontWeight: 700, marginBottom: "0.75rem" }}>Social Influence</h6>
                  <div style={{ fontSize: "var(--font-size-sm)" }}>
                    <span style={{ fontWeight: 800, color: "var(--color-movies, #E91E63)" }}>{stats.recommendedWatched}</span>
                    {" "}movies watched from recommendations
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </>
      )}
    </>
  );
}

export default MovieStatsPage;
