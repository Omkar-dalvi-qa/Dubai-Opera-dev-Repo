// filters helpers functions for event filters

export type SelectOption = { value: string; label: string };

export function categoryOptions(
  cards: Array<{ categoryId?: number | string | null; category: string }>,
): SelectOption[] {
  const map = new Map<string, SelectOption>();

  for (const c of cards) {
    const id = String(c.categoryId ?? "").trim();
    if (!id) continue;
    if (!map.has(id)) {
      map.set(id, { value: id, label: String(c.category || id) });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function screenOptions(
  screens: Array<{ id: number | string; name?: string | null }>,
): SelectOption[] {
  return (screens ?? [])
    .filter((s) => String(s?.name ?? "").trim().length > 0)
    .map((s) => ({ value: String(s.id), label: String(s.name) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function seasonOptions(
  seasons: Array<{ name?: string | null; slug?: string | null }>,
): SelectOption[] {
  return (seasons ?? [])
    .map((season) => {
      const name = String(season?.name ?? "").trim();
      const slug = String(season?.slug ?? "").trim();
      if (!name || !slug) return null;
      return { value: slug, label: name };
    })
    .filter((option): option is SelectOption => option !== null)
    .sort((a, b) => a.label.localeCompare(b.label));
}

