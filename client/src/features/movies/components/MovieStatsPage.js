import React from "react";
import { Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { computeMovieStats } from "../../../services/movieStats";
import { computeSocialMovieStats } from "../../../services/socialMovieStats";
import useStatsPage from "../../../hooks/useStatsPage";
import { StatsPageLayout, BarChart, HorizontalBar, SectionHeader } from "../../../components/shared/stats";
import CircleStats from "../../../components/shared/stats/CircleStats";

const RING_COLORS = { 1: "#4A154B", 2: "#2EB67D", 3: "#8B6914", 4: "#36C5F0" };

function AlignmentBar({ score, color }) {
  const pct = Math.round(score * 100);
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, background: "var(--color-border)", borderRadius: 4, height: 8 }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: color || "var(--color-movies, #E91E63)",
          borderRadius: 4,
          transition: "width 0.5s ease",
        }} />
      </div>
      <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 700, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

export default function MovieStatsPage() {
  const { items: movies, contacts, loading, periodFilter, setPeriodFilter, stats, socialStats, socialLoading, hasLinkedContacts } = useStatsPage("movies", computeMovieStats, computeSocialMovieStats);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)" }}>Loading stats...</div>;
  }

  const hasData = stats.totalWatched > 0;

  return (
    <StatsPageLayout
      title="Movie Stats"
      emoji={"\u{1F3AC}"}
      subtitle="Your watchlist, by the numbers"
      backLabel={"← Movies"}
      backTo="/movies"
      color="var(--color-movies, #E91E63)"
      periodFilter={periodFilter}
      onPeriodChange={setPeriodFilter}
      heroStats={hasData ? [
        { label: "Watched", value: stats.totalWatched, color: "var(--color-movies, #E91E63)" },
        { label: "Watchlist", value: stats.totalWatchlist, color: "var(--color-text-secondary)" },
        { label: "Avg Rating", value: stats.avgRating.toFixed(1), sub: `of ${stats.totalWatched} rated`, color: "var(--color-movies, #E91E63)" },
        { label: "Genres", value: stats.genresExplored, sub: "explored", color: "var(--color-primary)" },
      ] : null}
    >
      {!hasData ? (
        <div className="empty-state">
          <div className="empty-state-icon" style={{ backgroundColor: "var(--color-movies, #E91E63)", color: "#fff" }}>
            {"\u{1F3AC}"}
          </div>
          <div className="empty-state-title">No movie data yet</div>
          <div className="empty-state-text">Watch some movies and come back for insights.</div>
        </div>
      ) : (
        <>
          {/* Personal Stats */}
          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F3AD}"}>Genre Breakdown</SectionHeader>
                <HorizontalBar items={stats.genreBreakdown.slice(0, 8)} color="var(--color-movies, #E91E63)" />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"⭐"}>Rating Distribution</SectionHeader>
                <BarChart data={stats.ratingDistribution} color="var(--color-movies, #E91E63)" />
              </div>
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F4C5}"}>Movies by Year Watched</SectionHeader>
                <BarChart data={stats.watchedByYear} color="var(--color-movies, #E91E63)" />
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F4C0}"}>Decade Distribution</SectionHeader>
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
                <SectionHeader emoji={"\u{1F3AC}"}>Top Directors</SectionHeader>
                {stats.topDirectors.length > 0 ? (
                  <HorizontalBar items={stats.topDirectors.slice(0, 6)} color="#FF5722" />
                ) : (
                  <div style={{ color: "var(--color-text-tertiary)", fontSize: "var(--font-size-sm)" }}>Add directors to your movies to see this.</div>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem" }}>
                <SectionHeader emoji={"\u{1F465}"}>Movie Companions</SectionHeader>
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
                Add friends to your Circle to see taste compatibility, discover movies they love, and track how recommendations flow between you.
              </p>
              <Link to="/people" className="btn btn-sm btn-primary">Manage My Circle</Link>
            </div>
          ) : socialLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)" }}>
              Loading social stats...
            </div>
          ) : socialStats && (
            <>
              {/* Circle Compatibility */}
              {socialStats.alignments.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F91D}"}>Circle Compatibility</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {socialStats.alignments.slice(0, 5).map((a) => (
                      <div key={a.contact.id}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: RING_COLORS[a.contact.ring_level] || "#ccc",
                            color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "var(--font-size-xs)",
                            flexShrink: 0,
                          }}>
                            {(a.contact.display_name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 80 }}>
                            <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
                              {a.contact.display_name}
                            </div>
                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                              {a.overlap} movies in common
                            </div>
                          </div>
                          <AlignmentBar score={a.score} color={RING_COLORS[a.contact.ring_level]} />
                        </div>
                        {a.sharedLoved.length > 0 && (
                          <div style={{ marginLeft: 40, display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                            {a.sharedLoved.slice(0, 3).map((m) => (
                              <span key={m.title} style={{
                                background: "var(--color-surface-hover)",
                                border: "1px solid var(--color-border)",
                                borderRadius: 12,
                                padding: "0.1rem 0.5rem",
                                fontSize: "var(--font-size-xs)",
                                fontWeight: 600,
                              }}>
                                {m.title} ({m.myRating}{"★"}/{m.theirRating}{"★"})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discover from Your Circle */}
              {socialStats.suggestions && (
                <DiscoverSection suggestions={socialStats.suggestions} />
              )}

              {/* Your Influence */}
              {socialStats.influence && (socialStats.influence.sent > 0 || socialStats.influence.watchedFromRecs > 0) && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F4AC}"}>Your Influence</SectionHeader>
                  <Row className="g-3">
                    <Col xs={6} md={3}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-movies, #E91E63)" }}>{socialStats.influence.sent}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Recommended</div>
                      </div>
                    </Col>
                    <Col xs={6} md={3}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)" }}>{socialStats.influence.sentAccepted}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Accepted by friends</div>
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
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-warning)" }}>{socialStats.influence.watchedFromRecs}</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>Watched from recs</div>
                      </div>
                    </Col>
                  </Row>
                  {socialStats.influence.topInfluencer && (
                    <div style={{ marginTop: "0.75rem", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                      Top influencer: <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{socialStats.influence.topInfluencer.name}</span>
                      {" "}({socialStats.influence.topInfluencer.count} movie{socialStats.influence.topInfluencer.count !== 1 ? "s" : ""} you watched from their recs)
                    </div>
                  )}
                </div>
              )}

              {/* Genre Overlap */}
              {socialStats.genreOverlap.length > 0 && socialStats.alignments.length > 0 && (
                <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <SectionHeader emoji={"\u{1F3AF}"}>Genre Overlap with {socialStats.alignments[0].contact.display_name}</SectionHeader>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {socialStats.genreOverlap.map((g) => (
                      <div key={g.genre} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ minWidth: 80, fontSize: "var(--font-size-sm)", fontWeight: 600, textAlign: "right" }}>{g.genre}</span>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 2 }}>
                          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                            <div style={{
                              width: `${Math.min(100, (g.mine / Math.max(...socialStats.genreOverlap.map((x) => Math.max(x.mine, x.theirs)))) * 100)}%`,
                              height: 14,
                              background: "var(--color-movies, #E91E63)",
                              borderRadius: "4px 0 0 4px",
                              minWidth: g.mine > 0 ? 4 : 0,
                            }} />
                          </div>
                          <div style={{ width: 1, height: 18, background: "var(--color-text-tertiary)" }} />
                          <div style={{ flex: 1 }}>
                            <div style={{
                              width: `${Math.min(100, (g.theirs / Math.max(...socialStats.genreOverlap.map((x) => Math.max(x.mine, x.theirs)))) * 100)}%`,
                              height: 14,
                              background: RING_COLORS[socialStats.alignments[0].contact.ring_level] || "#36C5F0",
                              borderRadius: "0 4px 4px 0",
                              minWidth: g.theirs > 0 ? 4 : 0,
                            }} />
                          </div>
                        </div>
                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", minWidth: 40 }}>
                          {g.mine} / {g.theirs}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--color-movies, #E91E63)", marginRight: 4 }} />You</span>
                    <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: RING_COLORS[socialStats.alignments[0].contact.ring_level] || "#36C5F0", marginRight: 4 }} />{socialStats.alignments[0].contact.display_name}</span>
                  </div>
                </div>
              )}

              {/* Companion Circle Stats */}
              <CircleStats
                items={movies}
                contacts={contacts}
                activeStatus="watched"
                itemLabel="movies"
                overlapFields={[
                  { field: "genre", label: "Genres in Common" },
                  { field: "director", label: "Directors in Common" },
                ]}
                socialItems={socialStats?.socialMovies || []}
                color="var(--color-movies, #E91E63)"
              />
            </>
          )}
        </>
      )}
    </StatsPageLayout>
  );
}

function DiscoverSection({ suggestions }) {
  const { consensus, tasteMatch, tasteMatchContact, genreAffinity, suggestedGenre } = suggestions;
  const hasContent = consensus?.length > 0 || tasteMatch?.length > 0 || genreAffinity?.length > 0;

  if (!hasContent) return null;

  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--card-radius)", padding: "1.25rem", marginBottom: "1.5rem" }}>
      <SectionHeader emoji={"\u{1F3AF}"}>Discover from Your Circle</SectionHeader>

      {consensus.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", marginBottom: "0.4rem", color: "var(--color-text-secondary)" }}>
            Consensus Picks (rated 4+ by multiple friends)
          </div>
          <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
            {consensus.slice(0, 6).map((m) => (
              <MovieSuggestionCard key={m.tmdbId || m.id} movie={m} badge={`${m._consensusCount} friends`} />
            ))}
          </div>
        </div>
      )}

      {tasteMatch.length > 0 && tasteMatchContact && (
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", marginBottom: "0.4rem", color: "var(--color-text-secondary)" }}>
            Based on {tasteMatchContact} (your taste twin)
          </div>
          <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
            {tasteMatch.slice(0, 6).map((m) => (
              <MovieSuggestionCard key={m.tmdbId || m.id} movie={m} badge={`${m._socialRating}★`} />
            ))}
          </div>
        </div>
      )}

      {genreAffinity.length > 0 && suggestedGenre && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "var(--font-size-sm)", marginBottom: "0.4rem", color: "var(--color-text-secondary)" }}>
            Genre Frontier: {suggestedGenre} (popular in your circle, new to you)
          </div>
          <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.4rem" }}>
            {genreAffinity.slice(0, 6).map((m) => (
              <MovieSuggestionCard key={m.tmdbId || m.id} movie={m} badge={suggestedGenre} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MovieSuggestionCard({ movie, badge }) {
  return (
    <div style={{
      minWidth: 110,
      maxWidth: 110,
      background: "var(--color-bg)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--card-radius, 8px)",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {movie.posterUrl ? (
        <img src={movie.posterUrl} alt={movie.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
      ) : (
        <div style={{ width: "100%", height: 140, background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
          {"\u{1F3AC}"}
        </div>
      )}
      <div style={{ padding: "0.35rem 0.4rem" }}>
        <div style={{ fontWeight: 600, fontSize: "var(--font-size-xs)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {movie.title}
        </div>
        {badge && (
          <div style={{ fontSize: "0.6rem", color: "var(--color-movies, #E91E63)", fontWeight: 700, marginTop: "0.1rem" }}>
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}
