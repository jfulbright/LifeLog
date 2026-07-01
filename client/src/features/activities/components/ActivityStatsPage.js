import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { computeActivityStats } from "../../../services/activityStats";
import { computeSocialActivityStats } from "../api/socialActivityApi";
import useStatsPage from "../../../hooks/useStatsPage";
import useScopeToggle from "../../../hooks/useScopeToggle";
import { StatsPageLayout, BarChart, HorizontalBar, SectionHeader } from "../../../components/shared/stats";
import CircleStats from "../../../components/shared/stats/CircleStats";
import ScopeToggleBar from "../../../components/shared/stats/ScopeToggleBar";

const RING_COLORS = { 1: "#4A154B", 2: "#2EB67D", 3: "#8B6914", 4: "#36C5F0" };
const GROUP_LABELS = { snow: "Snow", bike: "Bike", water: "Water", land: "Land", air: "Air" };
const GROUP_COLORS = { snow: "#36C5F0", bike: "#2EB67D", water: "#4A90D9", land: "#8B6914", air: "#E91E63" };

export default function ActivityStatsPage() {
  const { items: activities, contacts, loading, periodFilter, setPeriodFilter, stats: baseStats, socialStats, socialLoading, hasLinkedContacts } = useStatsPage("activities", computeActivityStats, computeSocialActivityStats);
  const { setScope, scopeContacts, activeScope, scopedStats, inCommonCount } = useScopeToggle({
    socialItems: socialStats?.socialActivities,
    contacts,
    baseStats,
    computeStatsFn: computeActivityStats,
    experiencedStatus: "done",
    myItems: activities,
    matchKey: (m) => (m.title || m.name || "").toLowerCase() || null,
  });
  const stats = scopedStats;

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)" }}>Loading stats...</div>;
  }

  const hasData = stats.totalDone > 0;

  return (
    <StatsPageLayout
      title="Activity Stats"
      emoji={"\u{1F3D4}️"}
      subtitle="Your adventures, by the numbers"
      backLabel={"← Activities"}
      backTo="/activities"
      color="var(--color-activities, #2EB67D)"
      periodFilter={periodFilter}
      onPeriodChange={setPeriodFilter}
      heroStats={hasData ? [
        { label: "Completed", value: stats.totalDone, color: "var(--color-activities, #2EB67D)" },
        { label: "Avg Rating", value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", sub: stats.avgRating > 0 ? `of ${stats.totalDone} rated` : null, color: "var(--color-activities, #2EB67D)" },
        { label: "Types", value: stats.typesExplored, sub: "explored", color: "var(--color-primary)" },
        { label: "This Year", value: stats.doneThisYear, color: "var(--color-warning)" },
      ] : null}
    >
      <ScopeToggleBar scopeContacts={scopeContacts} activeScope={activeScope} setScope={setScope} inCommonCount={inCommonCount} color="var(--color-activities, #2EB67D)" />
      {!hasData ? (
        <div style={{ textAlign: "center", padding: "3rem 2rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{"\u{1F3D4}️"}</div>
          <h5 style={{ fontWeight: 700 }}>Your adventure story starts here</h5>
          <p style={{ color: "var(--color-text-secondary)" }}>Log your first completed activity to see stats.</p>
        </div>
      ) : (
        <>
          {/* Personal Stats */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F3BF}"}>Activity Types</SectionHeader>
                <HorizontalBar items={stats.typeBreakdown.slice(0, 10)} color="var(--color-activities, #2EB67D)" />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F4AA}"}>Difficulty Distribution</SectionHeader>
                {stats.difficultyDistribution.length > 0 ? (
                  <HorizontalBar items={stats.difficultyDistribution} color="#FF5722" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Add difficulty levels to see this.</p>
                )}
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F4C5}"}>Activities by Year</SectionHeader>
                {Object.keys(stats.activitiesByYear).length > 0 ? (
                  <BarChart data={stats.activitiesByYear} color="var(--color-activities, #2EB67D)" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>No dated activities yet.</p>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"⭐"}>Rating Distribution</SectionHeader>
                <BarChart data={stats.ratingDistribution} color="var(--color-activities, #2EB67D)" />
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F4CD}"}>Top Locations</SectionHeader>
                {stats.topLocations.length > 0 ? (
                  <HorizontalBar items={stats.topLocations.slice(0, 8)} color="var(--color-info)" />
                ) : (
                  <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Add locations to your activities to see this.</p>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F465}"}>Activity Companions</SectionHeader>
                {stats.topCompanions.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {stats.topCompanions.map((c) => (
                      <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)" }}>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                        <span style={{ color: "var(--color-text-secondary)" }}>{c.count} activit{c.count !== 1 ? "ies" : "y"}</span>
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
                Add friends to your Circle to see adventure partners, bucket list overlap, and what your circle has accomplished.
              </p>
              <Link to="/people" className="btn btn-sm btn-primary">Manage My Circle</Link>
            </div>
          ) : socialLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)" }}>
              Loading social stats...
            </div>
          ) : socialStats && (
            <>
              {/* Adventure Profile Comparison */}
              {socialStats.profileComparison && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F4CA}"}>Adventure Profile vs {socialStats.profileComparison.contact.display_name}</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {Object.entries(GROUP_LABELS).map(([key, label]) => {
                      const mine = socialStats.profileComparison.mine[key] || 0;
                      const theirs = socialStats.profileComparison.theirs[key] || 0;
                      const max = Math.max(mine, theirs, 1);
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ minWidth: 50, fontSize: "var(--font-size-sm)", fontWeight: 600, textAlign: "right" }}>{label}</span>
                          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
                            <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                              <div style={{
                                width: `${(mine / max) * 100}%`,
                                height: 14,
                                background: GROUP_COLORS[key],
                                borderRadius: "4px 0 0 4px",
                                minWidth: mine > 0 ? 4 : 0,
                              }} />
                            </div>
                            <div style={{ width: 1, height: 18, background: "var(--color-text-tertiary)" }} />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                width: `${(theirs / max) * 100}%`,
                                height: 14,
                                background: GROUP_COLORS[key],
                                opacity: 0.5,
                                borderRadius: "0 4px 4px 0",
                                minWidth: theirs > 0 ? 4 : 0,
                              }} />
                            </div>
                          </div>
                          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", minWidth: 40 }}>
                            {mine} / {theirs}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--color-activities, #2EB67D)", marginRight: 4 }} />You</span>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--color-activities, #2EB67D)", opacity: 0.5, marginRight: 4 }} />{socialStats.profileComparison.contact.display_name}</span>
                  </div>
                </div>
              )}

              {/* Adventure Partners */}
              {socialStats.partners.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F91D}"}>Adventure Partners</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {socialStats.partners.slice(0, 5).map((p) => (
                      <div key={p.contact.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: RING_COLORS[p.contact.ring_level] || "#ccc",
                          color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "var(--font-size-xs)",
                          flexShrink: 0,
                        }}>
                          {(p.contact.display_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{p.contact.display_name}</div>
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                            {p.sharedTypes.length > 0 && `${p.sharedTypes.slice(0, 3).join(", ")}`}
                            {p.sharedLocations.length > 0 && ` · ${p.sharedLocations.length} shared location${p.sharedLocations.length !== 1 ? "s" : ""}`}
                          </div>
                        </div>
                        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 700, color: "var(--color-activities, #2EB67D)" }}>
                          {p.theirCount} done
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bucket List Overlap */}
              {socialStats.bucketListOverlap.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F4A1}"}>Friends Who've Done Your Bucket List</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {socialStats.bucketListOverlap.slice(0, 6).map((b) => (
                      <div key={b.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--font-size-sm)" }}>
                        <span style={{ fontWeight: 600 }}>{b.type}</span>
                        <span style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-xs)" }}>
                          {b.friends.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Circle Achievements */}
              {socialStats.circleAchievements.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F3C6}"}>Activities Your Circle Has Done (That You Haven't)</SectionHeader>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {socialStats.circleAchievements.map((a) => (
                      <span key={a.type} style={{
                        background: "var(--color-surface-hover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        padding: "0.2rem 0.6rem",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                      }}>
                        {a.type} <span style={{ color: "var(--color-text-tertiary)" }}>({a.count} friend{a.count !== 1 ? "s" : ""})</span>
                      </span>
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
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-activities, #2EB67D)" }}>{socialStats.influence.sent}</div>
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
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-warning)" }}>{socialStats.influence.doneFromRecs}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Done from recs</div>
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Companion Circle Stats */}
              <CircleStats
                items={activities}
                contacts={contacts}
                activeStatus="done"
                itemLabel="activities"
                overlapFields={[
                  { field: "activityType", label: "Activity Types in Common" },
                  { field: "locationName", label: "Locations in Common" },
                ]}
                socialItems={socialStats?.socialActivities || []}
                color="var(--color-activities, #2EB67D)"
              />
            </>
          )}
        </>
      )}
    </StatsPageLayout>
  );
}
