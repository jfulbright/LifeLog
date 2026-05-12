import React, { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import topology from "world-atlas/countries-110m.json";
import { getCountryName, codeToFlag } from "../../../data/countries";

// Numeric ISO -> alpha-2 mapping for the topojson features
const NUMERIC_TO_ALPHA = {
  "004": "AF", "008": "AL", "012": "DZ", "020": "AD", "024": "AO", "028": "AG",
  "032": "AR", "051": "AM", "036": "AU", "040": "AT", "031": "AZ", "044": "BS",
  "048": "BH", "050": "BD", "052": "BB", "112": "BY", "056": "BE", "084": "BZ",
  "204": "BJ", "064": "BT", "068": "BO", "070": "BA", "072": "BW", "076": "BR",
  "096": "BN", "100": "BG", "854": "BF", "108": "BI", "116": "KH", "120": "CM",
  "132": "CV", "140": "CF", "148": "TD", "152": "CL", "156": "CN", "170": "CO",
  "174": "KM", "178": "CG", "180": "CD", "188": "CR", "191": "HR", "192": "CU",
  "196": "CY", "203": "CZ", "208": "DK", "262": "DJ", "212": "DM", "214": "DO",
  "218": "EC", "818": "EG", "222": "SV", "226": "GQ", "232": "ER", "233": "EE",
  "748": "SZ", "231": "ET", "242": "FJ", "246": "FI", "250": "FR", "266": "GA",
  "270": "GM", "268": "GE", "276": "DE", "288": "GH", "300": "GR", "308": "GD",
  "320": "GT", "324": "GN", "624": "GW", "328": "GY", "332": "HT", "340": "HN",
  "348": "HU", "352": "IS", "356": "IN", "360": "ID", "364": "IR", "368": "IQ",
  "372": "IE", "376": "IL", "380": "IT", "384": "CI", "388": "JM", "392": "JP",
  "400": "JO", "398": "KZ", "404": "KE", "296": "KI", "414": "KW", "417": "KG",
  "418": "LA", "428": "LV", "422": "LB", "426": "LS", "430": "LR", "434": "LY",
  "438": "LI", "440": "LT", "442": "LU", "450": "MG", "454": "MW", "458": "MY",
  "462": "MV", "466": "ML", "470": "MT", "584": "MH", "478": "MR", "480": "MU",
  "484": "MX", "583": "FM", "498": "MD", "492": "MC", "496": "MN", "499": "ME",
  "504": "MA", "508": "MZ", "104": "MM", "516": "NA", "520": "NR", "524": "NP",
  "528": "NL", "554": "NZ", "558": "NI", "562": "NE", "566": "NG", "408": "KP",
  "807": "MK", "578": "NO", "512": "OM", "586": "PK", "585": "PW", "275": "PS",
  "591": "PA", "598": "PG", "600": "PY", "604": "PE", "608": "PH", "616": "PL",
  "620": "PT", "634": "QA", "642": "RO", "643": "RU", "646": "RW", "659": "KN",
  "662": "LC", "670": "VC", "882": "WS", "674": "SM", "678": "ST", "682": "SA",
  "686": "SN", "688": "RS", "690": "SC", "694": "SL", "702": "SG", "703": "SK",
  "705": "SI", "090": "SB", "706": "SO", "710": "ZA", "410": "KR", "728": "SS",
  "724": "ES", "144": "LK", "729": "SD", "740": "SR", "752": "SE", "756": "CH",
  "760": "SY", "158": "TW", "762": "TJ", "834": "TZ", "764": "TH", "626": "TL",
  "768": "TG", "776": "TO", "780": "TT", "788": "TN", "792": "TR", "795": "TM",
  "798": "TV", "800": "UG", "804": "UA", "784": "AE", "826": "GB", "840": "US",
  "858": "UY", "860": "UZ", "548": "VU", "336": "VA", "862": "VE", "704": "VN",
  "887": "YE", "894": "ZM", "716": "ZW", "124": "CA",
};

const PIN_COLORS = {
  visited:  { fill: "#0a7fa8", stroke: "#fff", text: "#fff" },
  wishlist: { fill: "#c48f0b", stroke: "#fff", text: "#fff" },
};

const COUNTRY_FILLS = {
  visited: "#36C5F0",
  wishlist: "#ECB22E",
};

const COUNTRY_STROKES = {
  visited: "#0a94bf",
  wishlist: "#c48f0b",
};

function WorldMapView({ items = [], onCountryClick }) {
  const [showPins, setShowPins] = useState(true);
  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });

  const countryData = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const code = item.country;
      if (!code) return;
      if (!map[code]) map[code] = { visited: false, wishlist: false, trips: [] };
      if (item.status === "visited") map[code].visited = true;
      if (item.status === "wishlist") map[code].wishlist = true;
      map[code].trips.push(item);
    });
    return map;
  }, [items]);

  const pinData = useMemo(() => {
    const cityMap = {};
    items.forEach((item) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lng);
      if (!lat || !lng) return;
      const key = `${item.city || ""}|${item.country || ""}`;
      if (!cityMap[key]) {
        cityMap[key] = {
          coordinates: [lng, lat],
          city: item.city || getCountryName(item.country) || "Location",
          country: item.country,
          trips: [],
          visited: false,
          wishlist: false,
        };
      }
      if (item.status === "visited") cityMap[key].visited = true;
      if (item.status === "wishlist") cityMap[key].wishlist = true;
      cityMap[key].trips.push(item);
    });
    return Object.values(cityMap);
  }, [items]);

  const getPinStyle = (pin) => {
    if (pin.visited) return PIN_COLORS.visited;
    if (pin.wishlist) return PIN_COLORS.wishlist;
    return null;
  };

  const getCountryFill = (numericCode) => {
    const alpha2 = NUMERIC_TO_ALPHA[numericCode];
    if (!alpha2 || !countryData[alpha2]) return "#e8e8e8";
    const data = countryData[alpha2];
    if (data.visited) return COUNTRY_FILLS.visited;
    if (data.wishlist) return COUNTRY_FILLS.wishlist;
    return "#e8e8e8";
  };

  const getCountryStroke = (numericCode) => {
    const alpha2 = NUMERIC_TO_ALPHA[numericCode];
    if (!alpha2 || !countryData[alpha2]) return "#d0d0d0";
    const data = countryData[alpha2];
    if (data.visited) return COUNTRY_STROKES.visited;
    if (data.wishlist) return COUNTRY_STROKES.wishlist;
    return "#d0d0d0";
  };

  const pinnedCityCount = pinData.filter((p) => getPinStyle(p)).length;
  const s = 1 / position.zoom;

  return (
    <div style={{ position: "relative" }}>
      {/* Pins toggle */}
      <div className="d-flex gap-2 flex-wrap mb-3">
        <button
          type="button"
          onClick={() => setShowPins((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.3rem 0.75rem",
            borderRadius: "20px",
            border: "2px solid #555",
            background: showPins ? "#555" : "transparent",
            color: showPins ? "#fff" : "#555",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          📍 Pins {pinnedCityCount > 0 && `(${pinnedCityCount})`}
        </button>
      </div>

      {/* Map */}
      <div style={{ position: "relative", borderRadius: "var(--card-radius)", overflow: "hidden", background: "#b8d4e8", border: "1px solid var(--color-border)" }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 140, center: [0, 20] }}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates, zoom })}
          >
            <Geographies geography={topology}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numericCode = geo.id;
                  const alpha2 = NUMERIC_TO_ALPHA[numericCode];
                  const fill = getCountryFill(numericCode);
                  const stroke = getCountryStroke(numericCode);
                  const hasData = alpha2 && countryData[alpha2];

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none", cursor: hasData ? "pointer" : "default" },
                        hover: {
                          outline: "none",
                          fill: hasData ? stroke : "#d8d8d8",
                          cursor: hasData ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) => {
                        if (!alpha2) return;
                        const countryName = getCountryName(alpha2);
                        const data = countryData[alpha2];
                        const tripCount = data?.trips?.length || 0;
                        const flag = codeToFlag(alpha2);
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          content: `${flag} ${countryName}${tripCount > 0 ? ` · ${tripCount} trip${tripCount > 1 ? "s" : ""}` : ""}`,
                        });
                      }}
                      onMouseMove={(e) => {
                        setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : t);
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => {
                        if (alpha2 && onCountryClick) {
                          const data = countryData[alpha2];
                          onCountryClick({ code: alpha2, name: getCountryName(alpha2), data });
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {showPins && pinData.map((pin, i) => {
              const style = getPinStyle(pin);
              if (!style) return null;
              const count = pin.trips.length;
              const flag = pin.country ? codeToFlag(pin.country) : "";

              return (
                <Marker
                  key={i}
                  coordinates={pin.coordinates}
                  onMouseEnter={(e) => {
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      content: `${flag} ${pin.city}${count > 1 ? ` · ${count} trips` : ""}`,
                    });
                  }}
                  onMouseMove={(e) => {
                    setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : t);
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => {
                    if (onCountryClick && pin.country) {
                      const data = countryData[pin.country] || { trips: pin.trips };
                      onCountryClick({ code: pin.country, name: getCountryName(pin.country), data });
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={7 * s}
                    cx={0.5 * s}
                    cy={0.5 * s}
                    fill="rgba(0,0,0,0.25)"
                  />
                  <circle
                    r={7 * s}
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth={1.5 * s}
                  />
                  {count > 1 ? (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={7 * s}
                      fontWeight="700"
                      fill={style.text}
                      style={{ pointerEvents: "none", fontFamily: "system-ui, sans-serif" }}
                    >
                      {count}
                    </text>
                  ) : (
                    <circle r={2.5 * s} fill={style.stroke} />
                  )}
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Zoom controls */}
        <div style={{ position: "absolute", bottom: "1rem", right: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {[
            { label: "+", action: () => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) })) },
            { label: "\u2212", action: () => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) })) },
            { label: "\u2302", action: () => setPosition({ coordinates: [0, 20], zoom: 1 }) },
          ].map(({ label, action }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              style={{
                width: 32, height: 32, borderRadius: 4,
                background: "rgba(255,255,255,0.9)", border: "1px solid var(--color-border)",
                fontWeight: 700, fontSize: "1rem", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "fixed",
          left: tooltip.x + 12,
          top: tooltip.y - 32,
          background: "rgba(29,28,29,0.92)",
          color: "#fff",
          padding: "0.3rem 0.6rem",
          borderRadius: 4,
          fontSize: "var(--font-size-sm)",
          fontWeight: 600,
          pointerEvents: "none",
          zIndex: 9999,
          whiteSpace: "nowrap",
        }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export default WorldMapView;
