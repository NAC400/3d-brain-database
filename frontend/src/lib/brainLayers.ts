/** Both atlases use these categories; SPL has no Allen parent hierarchy. */
export function refineCategory(category: string, name: string, parentName: string | null): string {
  const text = `${name} ${parentName ?? ''}`.toLowerCase();
  if (category === 'Diencephalon') {
    if (/epithalam|pineal/.test(text)) return 'Diencephalon – Epithalamus';
    if (/subthalam/.test(text)) return 'Diencephalon – Subthalamus';
    if (/hypothalam/.test(text)) return 'Diencephalon – Hypothalamus';
    if (/thalam|pulvinar|geniculate/.test(text)) return 'Diencephalon – Thalamus';
  }
  if (category === 'Mesencephalon (Midbrain)') {
    if (/substantia nigra/.test(text)) return 'Mesencephalon – Substantia Nigra';
    if (/tectum|superior collicul|inferior collicul/.test(text)) return 'Mesencephalon – Tectum';
    if (/tegmentum/.test(text)) return 'Mesencephalon – Tegmentum';
  }
  return category;
}

export function categoryIsVisible(category: string, activeCategories: Set<string>): boolean {
  return activeCategories.size === 0 || activeCategories.has(category);
}
