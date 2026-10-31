import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#0A161D",
          color: "#F4F5F1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 700 }}>
          <div style={{ width: 28, height: 28, background: "#3E8E7E", transform: "rotate(45deg)", borderRadius: 4 }} />
          Oryvchem
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Industrial chemicals, sourced where they&apos;re made.
          </div>
          <div style={{ fontSize: 32, color: "#A9B7B3" }}>Foshan · Guangdong · China — Chemical sourcing agent</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#3E8E7E" }}>
          <span>EN · AR · FR</span>
          <span>oryvchem.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
