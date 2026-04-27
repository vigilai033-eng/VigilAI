import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { techStack } = await req.json();
    if (!techStack || techStack.length === 0) {
      return NextResponse.json({ threats: [] });
    }

    // To avoid hitting rate limits on NVD API (no API key = 5 req/min),
    // we'll just search the first two technologies in their stack.
    const techsToSearch = techStack.slice(0, 2);
    let allCves: any[] = [];

    for (const tech of techsToSearch) {
      try {
        const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(tech)}&resultsPerPage=5`;
        const res = await fetch(url, {
          headers: { "User-Agent": "VigilAI-Security-App" },
          next: { revalidate: 3600 } // cache for 1 hour to prevent rate limits
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.vulnerabilities) {
            allCves = [...allCves, ...data.vulnerabilities];
          }
        }
      } catch (err) {
        console.error(`Failed to fetch CVEs for ${tech}:`, err);
      }
    }

    // Format and sort CVEs
    const threats = allCves.map((item: any) => {
      const cve = item.cve;
      
      // Try to find CVSS V3 or V2 metrics
      const metrics = cve.metrics?.cvssMetricV31?.[0] || 
                      cve.metrics?.cvssMetricV30?.[0] || 
                      cve.metrics?.cvssMetricV2?.[0];
                      
      const severity = metrics?.cvssData?.baseSeverity || metrics?.baseSeverity || "MEDIUM";
      const desc = cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description available.";
      
      return {
        id: cve.id,
        title: `${cve.id} (${techStack.find((t: string) => desc.toLowerCase().includes(t.toLowerCase())) || "Component"} vulnerability)`,
        description: desc.length > 120 ? desc.substring(0, 120) + "..." : desc,
        severity: severity.toUpperCase(),
        published: new Date(cve.published).toLocaleDateString(),
        score: metrics?.cvssData?.baseScore || 5.0
      };
    });

    // Sort by CVSS score descending
    threats.sort((a, b) => b.score - a.score);

    // Get top 3, filter out duplicates
    const uniqueThreats = Array.from(new Map(threats.map((item) => [item.id, item])).values()).slice(0, 3);

    return NextResponse.json({ threats: uniqueThreats });

  } catch (error) {
    console.error("Threats API error:", error);
    return NextResponse.json({ threats: [] }, { status: 500 });
  }
}
