import createScreenReaderOnly from './createScreenReaderOnly';
import insertElementWithinChildren from './insertElementWithinChildren';
import insertElementWithinElement from './insertElementWithinElement';
import renderScreenReaderComments from './renderScreenReaderComments';

// Annotation types that support comments
const COMMENT_TYPES = ['highlight', 'point', 'area'];

/**
 * Insert a hint into the DOM for screen readers for a specific annotation.
 *
 * @param {Object} annotation The annotation to insert a hint for
 * @param {Number} num The number of the annotation out of all annotations of the same type
 */
export default function insertScreenReaderHint (annotation, num = 0) {
  switch (annotation.type) {
    case 'highlight':
    case 'strikeout':
      const rects = annotation.rectangles;
      const first = rects[0];
      const last = rects[rects.length - 1];

      insertElementWithinElement(
        createScreenReaderOnly(`Begin ${annotation.type} annotation ${num}`, annotation.uuid),
        first.x, first.y, annotation.page, true
      );

      insertElementWithinElement(
        createScreenReaderOnly(`End ${annotation.type} annotation ${num}`, `${annotation.uuid}-end`),
        last.x + last.width, last.y, annotation.page, false
      );
      break;

    case 'textbox':
    case 'point':
      const text = annotation.type === 'textbox' ? ` (content: ${annotation.content})` : '';

      insertElementWithinChildren(
        createScreenReaderOnly(`${annotation.type} annotation ${num}${text}`, annotation.uuid),
        annotation.x, annotation.y, annotation.page
      );
      break;

    case 'drawing':
    case 'area':
      const x = typeof annotation.x !== 'undefined' ? annotation.x : annotation.lines[0][0];
      const y = typeof annotation.y !== 'undefined' ? annotation.y : annotation.lines[0][1];

      insertElementWithinChildren(
        createScreenReaderOnly('Unlabeled drawing', annotation.uuid),
        x, y, annotation.page
      );
      break;
  }

  // Include comments in screen reader hint
  if (COMMENT_TYPES.includes(annotation.type)) {
    renderScreenReaderComments(annotation.documentId, annotation.uuid);
  }
}
