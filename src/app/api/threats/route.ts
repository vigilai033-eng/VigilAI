import { NextResponse } from "next/server";

// Helper to format date exactly as NVD API requires: YYYY-MM-DDTHH:mm:ss.000
const formatDateForNVD = (date: Date) => {
  return date.toISOString().substring(0, 19) + ".000";
};

// Helper for keyword expansion and filtering exclusions
const getSearchConfig = (keyword: string) => {
  let query = keyword;
  let exclusions: string[] = [];
  const lowerK = keyword.toLowerCase();

  if (lowerK === "react") {
    query = "React framework javascript";
    exclusions.push("reactos");
  }
  
  return { query, exclusions };
};

// GET method for testing in the browser
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "React";

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90); // last 90 days
    
    const pubStartDate = formatDateForNVD(startDate);
    const pubEndDate = formatDateForNVD(endDate);

    const { query, exclusions } = getSearchConfig(keyword);

    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&pubStartDate=${encodeURIComponent(pubStartDate)}&pubEndDate=${encodeURIComponent(pubEndDate)}&resultsPerPage=50`;
    
    const res = await fetch(url, {
      headers: { "User-Agent": "VigilAI-Security-App" },
      next: { revalidate: 3600 }
    });
    
    if (!res.ok) {
      throw new Error(`NVD API responded with status: ${res.status}`);
    }

    const data = await res.json();
    let vulnerabilities = data.vulnerabilities || [];

    // Filter results strictly
    vulnerabilities = vulnerabilities.filter((item: any) => {
      const desc = item.cve.descriptions?.find((d: any) => d.lang === "en")?.value?.toLowerCase() || "";
      if (!desc.includes(keyword.toLowerCase())) return false; // Must contain exact original keyword
      if (exclusions.some(ex => desc.includes(ex))) return false; // Must not contain exclusions
      return true;
    });

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

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);
    
    const pubStartDate = formatDateForNVD(startDate);
    const pubEndDate = formatDateForNVD(endDate);

    const techsToSearch = techStack.slice(0, 2);
    let allThreats: any[] = [];

    for (const tech of techsToSearch) {
      try {
        const { query, exclusions } = getSearchConfig(tech);
        const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&pubStartDate=${encodeURIComponent(pubStartDate)}&pubEndDate=${encodeURIComponent(pubEndDate)}&resultsPerPage=50`;
        
        const res = await fetch(url, {
          headers: { "User-Agent": "VigilAI-Security-App" },
          next: { revalidate: 3600 } 
        });
        
        if (res.ok) {
          const data = await res.json();
          let vulnerabilities = data.vulnerabilities || [];
          
          vulnerabilities = vulnerabilities.filter((item: any) => {
            const desc = item.cve.descriptions?.find((d: any) => d.lang === "en")?.value?.toLowerCase() || "";
            if (!desc.includes(tech.toLowerCase())) return false;
            if (exclusions.some(ex => desc.includes(ex))) return false;
            return true;
          });

          const formatted = vulnerabilities.map((item: any) => {
            const cve = item.cve;
            const metrics = cve.metrics?.cvssMetricV31?.[0] || 
                            cve.metrics?.cvssMetricV30?.[0] || 
                            cve.metrics?.cvssMetricV2?.[0];
                            
            const severity = metrics?.cvssData?.baseSeverity || metrics?.baseSeverity || "MEDIUM";
            const desc = cve.descriptions?.find((d: any) => d.lang === "en")?.value || "No description available.";
            
            return {
              id: cve.id,
              title: `${cve.id} (${tech} vulnerability)`,
              description: desc.length > 120 ? desc.substring(0, 120) + "..." : desc,
              severity: severity.toUpperCase(),
              publishedDate: new Date(cve.published).toLocaleDateString(),
              published: new Date(cve.published).toLocaleDateString(),
              score: metrics?.cvssData?.baseScore || 5.0
            };
          });

          allThreats = [...allThreats, ...formatted];
        }
      } catch (err) {
        console.error(`Failed to fetch CVEs for ${tech}:`, err);
      }
    }

    allThreats.sort((a, b) => b.score - a.score);
    const uniqueThreats = Array.from(new Map(allThreats.map((item) => [item.id, item])).values()).slice(0, 3);

    return NextResponse.json({ threats: uniqueThreats });

  } catch (error) {
    console.error("Threats POST API error:", error);
    return NextResponse.json({ threats: [] }, { status: 500 });
  }
}
