import { NextResponse } from "next/server";

// GET method for testing in the browser
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "React";

    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=5`;
    const res = await fetch(url, {
      headers: { "User-Agent": "VigilAI-Security-App" },
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      throw new Error(`NVD API responded with status: ${res.status}`);
    }

    const data = await res.json();
    const vulnerabilities = data.vulnerabilities || [];

    const threats = vulnerabilities.map((item: any) => {
      const cve = item.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || 
                      cve.metrics?.cvssMetricV30?.[0] || 
                      cve.metrics?.cvssMetricV2?.[0];
                      
      const severity = metrics?.cvssData?.baseSeverity || metrics?.baseSeverity || "MEDIUM";
      const desc = cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description available.";
      
      return {
        id: cve.id,
        title: `${cve.id} (${keyword} vulnerability)`,
        description: desc.length > 120 ? desc.substring(0, 120) + "..." : desc,
        severity: severity.toUpperCase(),
        publishedDate: new Date(cve.published).toLocaleDateString(),
        score: metrics?.cvssData?.baseScore || 5.0
      };
    });

    threats.sort((a: any, b: any) => b.score - a.score);
    const uniqueThreats = Array.from(new Map(threats.map((item: any) => [item.id, item])).values()).slice(0, 3);

    return NextResponse.json({ threats: uniqueThreats });

  } catch (error) {
    console.error("Threats GET API error:", error);
    return NextResponse.json({ threats: [], error: "Failed to fetch CVEs" }, { status: 500 });
  }
}

// POST method for the Dashboard to use with multiple tech stacks
export async function POST(req: Request) {
  try {
    const { techStack } = await req.json();
    if (!techStack || techStack.length === 0) {
      return NextResponse.json({ threats: [] });
    }

    const techsToSearch = techStack.slice(0, 2);
    let allCves: any[] = [];

    for (const tech of techsToSearch) {
      try {
        const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(tech)}&resultsPerPage=5`;
        const res = await fetch(url, {
          headers: { "User-Agent": "VigilAI-Security-App" },
          next: { revalidate: 3600 } 
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

    const threats = allCves.map((item: any) => {
      const cve = item.cve;
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

    threats.sort((a, b) => b.score - a.score);
    const uniqueThreats = Array.from(new Map(threats.map((item) => [item.id, item])).values()).slice(0, 3);

    return NextResponse.json({ threats: uniqueThreats });

  } catch (error) {
    console.error("Threats POST API error:", error);
    return NextResponse.json({ threats: [] }, { status: 500 });
  }
}
