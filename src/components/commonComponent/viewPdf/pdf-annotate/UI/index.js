/*
 * @Author: sunchong
 * @Date: 2024-10-15 15:34:10
 * @LastEditTime: 2024-10-15 15:41:31
 * @Msg: Nothing
 */
import { addEventListener, removeEventListener, fireEvent } from './event';
import { disableEdit, enableEdit } from './edit';
import { disablePen, enablePen, setPen, enableUndo } from './pen';
import { disablePoint, enablePoint } from './point';
import { disableRect, enableRect } from './rect';
import { disableText, enableText, setText } from './text';
import { createPage, renderPage } from './page';

export default {
  addEventListener,
  removeEventListener,
  fireEvent,
  disableEdit,
  enableEdit,
  disablePen,
  enablePen,
  setPen,
  enableUndo,
  disablePoint,
  enablePoint,
  disableRect,
  enableRect,
  disableText,
  enableText,
  setText,
  createPage,
  renderPage
};
