import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { computeEventStats } from "../../../services/eventStats";
import { computeSocialEventStats } from "../api/socialEventApi";
import useStatsPage from "../../../hooks/useStatsPage";
import { StatsPageLayout, BarChart, HorizontalBar, SectionHeader } from "../../../components/shared/stats";
import CircleStats from "../../../components/shared/stats/CircleStats";

const RING_COLORS = { 1: "#4A154B", 2: "#2EB67D", 3: "#8B6914", 4: "#36C5F0" };

export default function EventStatsPage() {
  const { items: events, contacts, loading, periodFilter, setPeriodFilter, stats, socialStats, socialLoading, hasLinkedContacts } = useStatsPage("events", computeEventStats, computeSocialEventStats);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)" }}>Loading stats...</div>;
  }

  const hasData = stats.totalAttended > 0;

  return (
    <StatsPageLayout
      title="Event Stats"
      emoji={"\u{1F39F}️"}
      subtitle="Your experiences, by the numbers"
      backLabel={"← Events"}
      backTo="/events"
      color="var(--color-events)"
      periodFilter={periodFilter}
      onPeriodChange={setPeriodFilter}
      heroStats={hasData ? [
        { label: "Attended", value: stats.totalAttended, color: "var(--color-events)" },
        { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", sub: stats.avgRating > 0 ? `of ${stats.totalAttended} rated` : null, color: "var(--color-events)" },
        { label: "Types", value: stats.typesExplored, sub: "explored", color: "var(--color-primary)" },
        { label: "This Year", value: stats.attendedThisYear, color: "var(--color-success)" },
      ] : null}
    >
      {!hasData ? (
        <div style={{ textAlign: "center", padding: "3rem 2rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{"\u{1F39F}️"}</div>
          <h5 style={{ fontWeight: 700 }}>Your event story starts here</h5>
          <p style={{ color: "var(--color-text-secondary)" }}>Log your first attended event to see stats.</p>
        </div>
      ) : (
        <>
          {/* Personal Stats */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F3AD}"}>Event Types</SectionHeader>
                <HorizontalBar items={stats.typeBreakdown} color="var(--color-events)" />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F4C5}"}>Events by Year</SectionHeader>
                {Object.keys(stats.eventsByYear).length > 0 ? (
                  <BarChart data={stats.eventsByYear} color="var(--color-events)" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>No dated events yet.</p>
                )}
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"⭐"}>Rating Distribution</SectionHeader>
                <BarChart data={stats.ratingDistribution} color="var(--color-events)" />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F3DF}️"}>Top Venues</SectionHeader>
                {stats.topVenues.length > 0 ? (
                  <HorizontalBar items={stats.topVenues.slice(0, 8)} color="var(--color-primary)" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Add venues to your events to see this.</p>
                )}
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F3D9}️"}>Top Cities</SectionHeader>
                {stats.topCities.length > 0 ? (
                  <HorizontalBar items={stats.topCities} color="var(--color-info)" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Add cities to your events to see this.</p>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F465}"}>Event Companions</SectionHeader>
                {stats.topCompanions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {stats.topCompanions.map((c) => (
                      <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)" }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: "var(--color-text-secondary)" }}>{c.count} event{c.count !== 1 ? "s" : ""}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Tag companions to see this.</p>
                )}
              </div>
            </Col>
          </Row>

          {/* ═══ Social Stats ═══ */}

          {!hasLinkedContacts ? (
            <div style={{
              background: "linear-gradient(135deg, #F5EEF8 0%, #EAF8FE 100%)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--card-radius)",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{"\u{1F465}"}</div>
              <h6 style={{ fontWeight: 700 }}>Circle Stats — Unlock with Friends</h6>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", maxWidth: 400, margin: "0 auto 1rem" }}>
                Add friends to your Circle to see event buddies, shared artists, and what your circle is going to next.
              </p>
              <Link to="/people" className="btn btn-sm btn-primary">Manage My Circle</Link>
            </div>
          ) : socialLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)" }}>
              Loading social stats...
            </div>
          ) : socialStats && (
            <>
              {/* Event Buddies */}
              {socialStats.buddies.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F91D}"}>Event Buddies</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {socialStats.buddies.slice(0, 5).map((b) => (
                      <div key={b.contact.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: RING_COLORS[b.contact.ring_level] || "#ccc",
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "var(--font-size-xs)",
                          flexShrink: 0,
                        }}>
                          {(b.contact.display_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{b.contact.display_name}</div>
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                            {b.sharedTypes.length > 0 && `${b.sharedTypes.join(", ")} fan`}
                            {b.sharedArtists.length > 0 && ` · ${b.sharedArtists.length} shared artist${b.sharedArtists.length !== 1 ? "s" : ""}`}
                            {b.sharedVenues.length > 0 && ` · ${b.sharedVenues.length} shared venue${b.sharedVenues.length !== 1 ? "s" : ""}`}
                          </div>
                        </div>
                        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-events)" }}>
                          {b.theirCount} events
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Artists */}
              {socialStats.sharedArtists.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F3B5}"}>Artists You've Both Seen</SectionHeader>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {socialStats.sharedArtists.map((a) => (
                      <span key={a.artist} style={{
                        background: "var(--color-surface-hover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        padding: "0.2rem 0.6rem",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                      }}>
                        {a.artist} <span style={{ color: "var(--color-text-tertiary)" }}>({a.friends.join(", ")})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Circle is Going To */}
              {socialStats.upcomingFromCircle.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F4C5}"}>Your Circle is Going To</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {socialStats.upcomingFromCircle.map((e, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "var(--font-size-sm)" }}>
                        <span style={{ fontWeight: 600, flex: 1 }}>{e.title}</span>
                        {e.venue && <span style={{ color: "var(--color-text-tertiary)" }}>{e.venue}</span>}
                        {e.date && <span style={{ color: "var(--color-text-tertiary)" }}>{new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-events)", fontWeight: 600 }}>{e.friend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Influence */}
              {socialStats.influence && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F4AC}"}>Your Influence</SectionHeader>
                  <Row className="g-3">
                    <Col xs={6} md={3}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-events)" }}>{socialStats.influence.sent}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Recommended</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)" }}>{socialStats.influence.sentAccepted}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Accepted</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#36C5F0" }}>{socialStats.influence.received}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Received</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-warning)" }}>{socialStats.influence.attendedFromRecs}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Attended from recs</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Companion Circle Stats */}
              <CircleStats
                items={events}
                contacts={contacts}
                activeStatus="attended"
                itemLabel="events"
                overlapFields={[
                  { field: "venue", label: "Venues in Common" },
                  { field: "eventType", label: "Event Types in Common" },
                ]}
                socialItems={socialStats?.socialEvents || []}
                color="var(--color-events)"
              />
            </>
          )}
        </>
      )}
    </StatsPageLayout>
  );
}
