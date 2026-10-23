// Preserve the disclosure when publishing a diagram adapted from the source.
export function courseAdaptationMetadata(record) {
  const figures = record.figureAdaptations || [];
  const adapted = figures.some(figure => figure.sourceAdapted === true || figure.method === 'adapted_from_source_solution');
  if (record.sourceAdapted !== true) {
    if (record.sourceAdapted || adapted) throw Error('Adapted course figure lost its sourceAdapted flag');
    return {};
  }
  if (typeof record.adaptationNote !== 'string' || !record.adaptationNote.trim()
      || !figures.length || figures.some(figure => figure.visualReview !== 'verified'
        || figure.sourceAdapted !== true || typeof figure.adaptationNote !== 'string' || !figure.adaptationNote.trim())) {
    throw Error('Adapted course figure requires verified provenance and an adaptationNote');
  }
  return { sourceAdapted: true, adaptationNote: record.adaptationNote };
}
