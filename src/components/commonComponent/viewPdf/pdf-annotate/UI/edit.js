import PDFJSAnnotate from '../PDFJSAnnotate';

import appendChild from '../render/appendChild';
import {
  addEventListener,
  removeEventListener
} from './event';
import {
  BORDER_COLOR,
  disableUserSelect,
  enableUserSelect,
  findSVGContainer,
  findSVGAtPoint,
  getAnnotationRect,
  getMetadata,
  scaleDown,
  scaleUp
} from './utils';

let handmodel11 = false;
let _enabled = false;
let isDragging = false; let overlay;
let dragOffsetX, dragOffsetY, dragStartX, dragStartY;
const OVERLAY_BORDER_SIZE = 3;

/**
 * Create an overlay for editing an annotation.
 *
 * @param {Element} target The annotation element to apply overlay for
 */
function createEditOverlay (target) {
  destroyEditOverlay();

  overlay = document.createElement('div');
  const anchor = document.createElement('a');
  const parentNode = findSVGContainer(target).parentNode;
  const id = target.getAttribute('data-pdf-annotate-id');
  const rect = getAnnotationRect(target);
  const styleLeft = rect.left - OVERLAY_BORDER_SIZE;
  const styleTop = rect.top - OVERLAY_BORDER_SIZE;

  overlay.setAttribute('id', 'pdf-annotate-edit-overlay');
  overlay.setAttribute('data-target-id', id);
  overlay.style.boxSizing = 'content-box';
  overlay.style.position = 'absolute';
  overlay.style.top = `${styleTop}px`;
  overlay.style.left = `${styleLeft}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.border = `${OVERLAY_BORDER_SIZE}px solid ${BORDER_COLOR}`;
  overlay.style.borderRadius = `${OVERLAY_BORDER_SIZE}px`;

  if (handmodel11) {
    anchor.innerHTML = '×';
    anchor.setAttribute('href', 'javascript://');
    anchor.style.background = '#fff';
    anchor.style.borderRadius = '20px';
    anchor.style.border = '1px solid #bbb';
    anchor.style.color = '#bbb';
    anchor.style.fontSize = '16px';
    anchor.style.padding = '2px';
    anchor.style.textAlign = 'center';
    anchor.style.textDecoration = 'none';
    anchor.style.position = 'absolute';
    anchor.style.top = '-13px';
    anchor.style.right = '-13px';
    anchor.style.width = '25px';
    anchor.style.height = '25px';
    overlay.appendChild(anchor);

    anchor.addEventListener('click', deleteAnnotation);
    anchor.addEventListener('mouseover', () => {
      anchor.style.color = '#35A4DC';
      anchor.style.borderColor = '#999';
      anchor.style.boxShadow = '0 1px 1px #ccc';
    });
    anchor.addEventListener('mouseout', () => {
      anchor.style.color = '#bbb';
      anchor.style.borderColor = '#bbb';
      anchor.style.boxShadow = '';
    });
    overlay.addEventListener('mouseover', () => {
      if (!isDragging) { anchor.style.display = ''; }
    });
    overlay.addEventListener('mouseout', () => {
      anchor.style.display = 'none';
    });
  }
  parentNode.appendChild(overlay);
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('keyup', handleDocumentKeyup);
  document.addEventListener('mousedown', handleDocumentMousedown);
}

/**
 * Destroy the edit overlay if it exists.
 */
function destroyEditOverlay () {
  if (overlay) {
    overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  document.removeEventListener('click', handleDocumentClick);
  document.removeEventListener('keyup', handleDocumentKeyup);
  document.removeEventListener('mousedown', handleDocumentMousedown);
  document.removeEventListener('mousemove', handleDocumentMousemove);
  document.removeEventListener('mouseup', handleDocumentMouseup);
  enableUserSelect();
}

/**
 * Delete currently selected annotation
 */
function deleteAnnotation () {
  if (!overlay) { return; }

  const annotationId = overlay.getAttribute('data-target-id');
  const nodes = document.querySelectorAll(`[data-pdf-annotate-id="${annotationId}"]`);
  const svg = overlay.parentNode.querySelector('svg.annotationLayer');
  const { documentId } = getMetadata(svg);

  [...nodes].forEach((n) => {
    n.parentNode.removeChild(n);
  });

  PDFJSAnnotate.getStoreAdapter().deleteAnnotation(documentId, annotationId);

  destroyEditOverlay();
}

/**
 * Handle document.click event
 *
 * @param {Event} e The DOM event that needs to be handled
 */
function handleDocumentClick (e) {
  if (!findSVGAtPoint(e.clientX, e.clientY)) { return; }

  // Remove current overlay
  const overlay = document.getElementById('pdf-annotate-edit-overlay');
  if (overlay) {
    if (isDragging || e.target === overlay) {
      return;
    }

    destroyEditOverlay();
  }
}

/**
 * Handle document.keyup event
 *
 * @param {Event} e The DOM event that needs to be handled
 */
function handleDocumentKeyup (e) {
  if (overlay && e.keyCode === 46 &&
      e.target.nodeName.toLowerCase() !== 'textarea' &&
      e.target.nodeName.toLowerCase() !== 'input') {
    deleteAnnotation();
  }
}

/**
 * Handle document.mousedown event
 *
 * @param {Event} e The DOM event that needs to be handled
 */
function handleDocumentMousedown (e) {
  if (e.target !== overlay) { return; }

  // Highlight and strikeout annotations are bound to text within the document.
  // It doesn't make sense to allow repositioning these types of annotations.
  const annotationId = overlay.getAttribute('data-target-id');
  const target = document.querySelector(`[data-pdf-annotate-id="${annotationId}"]`);
  const type = target.getAttribute('data-pdf-annotate-type');

  if (type === 'highlight' || type === 'strikeout') { return; }

  isDragging = true;
  dragOffsetX = e.clientX;
  dragOffsetY = e.clientY;
  dragStartX = overlay.offsetLeft;
  dragStartY = overlay.offsetTop;

  overlay.style.background = 'rgba(255, 255, 255, 0.7)';
  overlay.style.cursor = 'move';
  if (handmodel11) {
    overlay.querySelector('a').style.display = 'none';
    document.addEventListener('mousemove', handleDocumentMousemove);
    document.addEventListener('mouseup', handleDocumentMouseup);
  }

  disableUserSelect();
}

/**
 * Handle document.mousemove event
 *
 * @param {Event} e The DOM event that needs to be handled
 */
function handleDocumentMousemove (e) {
  const annotationId = overlay.getAttribute('data-target-id');
  const parentNode = overlay.parentNode;
  const rect = parentNode.getBoundingClientRect();
  const y = (dragStartY + (e.clientY - dragOffsetY));
  const x = (dragStartX + (e.clientX - dragOffsetX));
  const minY = 0;
  const maxY = rect.height;
  const minX = 0;
  const maxX = rect.width;

  if (y > minY && y + overlay.offsetHeight < maxY) {
    overlay.style.top = `${y}px`;
  }

  if (x > minX && x + overlay.offsetWidth < maxX) {
    overlay.style.left = `${x}px`;
  }
}

/**
 * Handle document.mouseup event
 *
 * @param {Event} e The DOM event that needs to be handled
 */
function handleDocumentMouseup (e) {
  const annotationId = overlay.getAttribute('data-target-id');
  const target = document.querySelectorAll(`[data-pdf-annotate-id="${annotationId}"]`);
  const type = target[0].getAttribute('data-pdf-annotate-type');
  const svg = overlay.parentNode.querySelector('svg.annotationLayer');
  const { documentId } = getMetadata(svg);
  if (handmodel11) {
    overlay.querySelector('a').style.display = '';
  }

  function getDelta (propX, propY) {
    return calcDelta(parseInt(target[0].getAttribute(propX), 10), parseInt(target[0].getAttribute(propY), 10));
  }

  function calcDelta (x, y) {
    return {
      deltaX: OVERLAY_BORDER_SIZE + scaleDown(svg, { x: overlay.offsetLeft }).x - x,
      deltaY: OVERLAY_BORDER_SIZE + scaleDown(svg, { y: overlay.offsetTop }).y - y
    };
  }

  PDFJSAnnotate.getStoreAdapter().getAnnotation(documentId, annotationId).then((annotation) => {
    if (['area', 'highlight', 'point', 'textbox'].indexOf(type) > -1) {
      const { deltaX, deltaY } = getDelta('x', 'y');
      [...target].forEach((t, i) => {
        if (deltaY !== 0) {
          const modelY = parseInt(t.getAttribute('y'), 10) + deltaY;
          let viewY = modelY;

          if (type === 'textbox') {
            viewY += annotation.size;
          }

          if (type === 'point') {
            viewY = scaleUp(svg, { viewY }).viewY;
          }

          t.setAttribute('y', viewY);
          if (annotation.rectangles) {
            annotation.rectangles[i].y = modelY;
          } else if (annotation.y) {
            annotation.y = modelY;
          }
        }
        if (deltaX !== 0) {
          const modelX = parseInt(t.getAttribute('x'), 10) + deltaX;
          let viewX = modelX;

          if (type === 'point') {
            viewX = scaleUp(svg, { viewX }).viewX;
          }

          t.setAttribute('x', viewX);
          if (annotation.rectangles) {
            annotation.rectangles[i].x = modelX;
          } else if (annotation.x) {
            annotation.x = modelX;
          }
        }
      });
    // } else if (type === 'strikeout') {
    //   let { deltaX, deltaY } = getDelta('x1', 'y1');
    //   [...target].forEach(target, (t, i) => {
    //     if (deltaY !== 0) {
    //       t.setAttribute('y1', parseInt(t.getAttribute('y1'), 10) + deltaY);
    //       t.setAttribute('y2', parseInt(t.getAttribute('y2'), 10) + deltaY);
    //       annotation.rectangles[i].y = parseInt(t.getAttribute('y1'), 10);
    //     }
    //     if (deltaX !== 0) {
    //       t.setAttribute('x1', parseInt(t.getAttribute('x1'), 10) + deltaX);
    //       t.setAttribute('x2', parseInt(t.getAttribute('x2'), 10) + deltaX);
    //       annotation.rectangles[i].x = parseInt(t.getAttribute('x1'), 10);
    //     }
    //   });
    } else if (type === 'drawing') {
      const rect = scaleDown(svg, getAnnotationRect(target[0]));
      const [originX, originY] = annotation.lines[0];
      let { deltaX, deltaY } = calcDelta(originX, originY);

      // origin isn't necessarily at 0/0 in relation to overlay x/y
      // adjust the difference between overlay and drawing coords
      deltaY += (originY - rect.top);
      deltaX += (originX - rect.left);

      annotation.lines.forEach((line, i) => {
        const [x, y] = annotation.lines[i];
        annotation.lines[i][0] = x + deltaX;
        annotation.lines[i][1] = y + deltaY;
      });

      target[0].parentNode.removeChild(target[0]);
      appendChild(svg, annotation);
    }

    PDFJSAnnotate.getStoreAdapter().editAnnotation(documentId, annotationId, annotation);
  });

  setTimeout(() => {
    isDragging = false;
  }, 0);

  overlay.style.background = '';
  overlay.style.cursor = '';

  document.removeEventListener('mousemove', handleDocumentMousemove);
  document.removeEventListener('mouseup', handleDocumentMouseup);
  enableUserSelect();
}

/**
 * Handle annotation.click event
 *
 * @param {Element} e The annotation element that was clicked
 */
function handleAnnotationClick (target) {
  createEditOverlay(target);
}

/**
 * Enable edit mode behavior.
 */
export function enableEdit (flag) {
  if (_enabled) { return; }

  handmodel11 = flag;
  _enabled = true;
  addEventListener('annotation:click', handleAnnotationClick);
};

/**
 * Disable edit mode behavior.
 */
export function disableEdit () {
  destroyEditOverlay();

  if (!_enabled) { return; }

  _enabled = false;
  removeEventListener('annotation:click', handleAnnotationClick);
};
