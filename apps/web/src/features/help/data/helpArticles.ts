export interface HelpArticle {
  id: string;
  title: string;
  keywords: string[];
  body: string; // Plain text or markdown
  category?: string;
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'operational-vs-lifecycle-status',
    title: 'Operational Status vs Lifecycle Status',
    keywords: ['status', 'operational', 'lifecycle', 'condition', 'broken', 'repair', 'disposed'],
    category: 'Assets',
    body: `# Operational Status vs Lifecycle Status

Understanding the difference between these two statuses will help you keep your asset records accurate and avoid common mistakes.

## What is Operational Status?

**Operational Status** tells you: "What condition is this asset in today? Can I use it right now?"

Think of it as the asset's current working condition. It answers questions like:
- Is it working properly?
- Is it broken and needs repair?
- Is it safe to use?
- Is it currently in use on a job?

**Examples:**
- **In Use**: The asset is working normally and being used on site right now
- **Out of Service**: The asset is not working but still on site (maybe waiting for parts)
- **Under Repair**: The asset is currently being fixed
- **Quarantined**: The asset is unsafe to use (e.g., failed safety inspection)
- **Archived**: The asset has been inactive for a long time (60+ days)

## What is Lifecycle Status?

**Lifecycle Status** tells you: "Where is this asset in its journey? Is it on site, on hire, stored, or disposed?"

Think of it as the asset's place in the bigger picture. It answers questions like:
- Is this asset part of our active fleet?
- Has it arrived on site yet?
- Has it been removed or sent back?
- Has it been disposed of?

**Examples:**
- **Active**: The asset is part of our active fleet and on site
- **Expected / Not Yet On Site**: We've ordered this asset but it hasn't arrived yet
- **Decommissioned**: The asset has been taken out of service permanently
- **Disposed**: The asset has been sold, scrapped, or written off

## Common Mistakes

**Mistake 1**: Setting Operational Status to "In Use" when the asset hasn't arrived yet
- **Wrong**: Lifecycle = "Expected", Operational = "In Use"
- **Right**: Lifecycle = "Expected", Operational = "Archived" (or "Not Available")

**Mistake 2**: Setting Operational Status to "Under Repair" for a disposed asset
- **Wrong**: Lifecycle = "Disposed", Operational = "Under Repair"
- **Right**: Lifecycle = "Disposed", Operational = "Archived"

**Mistake 3**: Forgetting to update Lifecycle when an asset is removed
- **Wrong**: Asset is sent back to hire company but Lifecycle still shows "Active"
- **Right**: Update Lifecycle to "Decommissioned" or "Off Hire" when asset leaves

## Quick Guide

**If it's broken today** → Change **Operational Status**
- Broken but still on site? → "Out of Service" or "Under Repair"
- Unsafe to use? → "Quarantined"
- Not working for 60+ days? → "Archived" (auto-archived)

**If it's joined/left the site/fleet** → Change **Lifecycle Status**
- Just arrived? → Change from "Expected" to "Active"
- Sent back to hire company? → Change to "Decommissioned" or "Off Hire"
- Sold or scrapped? → Change to "Disposed"

**Remember**: Operational Status = "Can I use it now?" | Lifecycle Status = "Where is it in its journey?"`,
  },
];

/**
 * Search help articles by keyword or title
 */
export function searchHelpArticles(query: string): HelpArticle[] {
  if (!query.trim()) {
    return helpArticles;
  }

  const lowerQuery = query.toLowerCase();
  return helpArticles.filter((article) => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery);
    const keywordMatch = article.keywords.some((keyword) =>
      keyword.toLowerCase().includes(lowerQuery)
    );
    const bodyMatch = article.body.toLowerCase().includes(lowerQuery);
    return titleMatch || keywordMatch || bodyMatch;
  });
}

/**
 * Get article by ID
 */
export function getHelpArticle(id: string): HelpArticle | undefined {
  return helpArticles.find((article) => article.id === id);
}
