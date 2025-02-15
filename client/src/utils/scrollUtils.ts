import { Align } from 'react-window';
import { Comment } from '../pages/ConversationResult/CodeAnotation';
import { findElementInCurrentTab } from './domUtils';

type ReactWindowProps = {
  height: number;
  itemCount: number;
  itemSize: number;
};

export const getOffsetForIndexAndAlignment = (
  { height, itemCount, itemSize }: ReactWindowProps,
  index: number,
  align: Align,
  scrollOffset: number,
): number => {
  const size = height;
  const rowsOnPage = size / itemSize;
  const lastItemOffset = Math.max(0, itemCount * itemSize - size);
  const maxOffset = Math.min(lastItemOffset, index * itemSize);
  const minOffset = Math.max(0, index * itemSize - size + itemSize);

  if (index < rowsOnPage / 2) {
    // if in the first half of the first 'page', don't scroll
    return 0;
  }
  if (index < rowsOnPage || index > itemCount - rowsOnPage) {
    // if on the first or last page, minOffset/maxOffset will be incorrect, scroll to center the item
    return index * itemSize - size / 2;
  }
  if (index > itemCount - rowsOnPage / 2) {
    // if in the last half of the last page, scroll to bottom
    return lastItemOffset;
  }

  if (align === 'smart') {
    if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) {
      align = 'auto';
    } else {
      align = 'center';
    }
  }

  switch (align) {
    case 'start':
      return maxOffset;
    case 'end':
      return minOffset;
    case 'center': {
      const middleOffset = Math.round(minOffset + (maxOffset - minOffset) / 2);
      return middleOffset;
    }
    case 'auto':
    default:
      if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
        return scrollOffset;
      } else if (scrollOffset < minOffset) {
        return minOffset;
      } else {
        return maxOffset;
      }
  }
};

export const repositionAnnotationsOnScroll = (
  scrollTop: number,
  citations: Record<string, Comment[]>,
) => {
  let previousCommentsHeight = 0;
  let stickedCommentsHeight = 0;
  let previousCommentStopped = true;
  Object.values(citations).forEach((fileCite, index) => {
    fileCite.forEach((c: any) => {
      const comment = findElementInCurrentTab(`#comment-${c.i}`);
      if (!comment) {
        return;
      }
      const code = findElementInCurrentTab(`#code-${c.i}`);
      const file = findElementInCurrentTab(`#file-${index}`);

      if (comment && file && comment instanceof HTMLElement) {
        const commentRect = comment.getBoundingClientRect();
        const codeRect = (code || file).getBoundingClientRect();
        const fileRect = file.getBoundingClientRect();

        const codeBottom =
          Math.min(codeRect.bottom, fileRect.bottom) + scrollTop - 187; // calculate code bottom relative to parent
        const lowestPosition = Math.max(
          codeBottom - commentRect.height - previousCommentsHeight,
          0,
        );
        const maxTranslateY = previousCommentStopped
          ? Math.max(
              0,
              Math.min(scrollTop - stickedCommentsHeight, lowestPosition),
            )
          : scrollTop - stickedCommentsHeight;
        if (maxTranslateY === lowestPosition && scrollTop > codeBottom) {
          stickedCommentsHeight += commentRect.height + 12;
        }
        previousCommentStopped = maxTranslateY === lowestPosition;
        previousCommentsHeight += commentRect.height + 12;
        comment.style.transform = `translateY(${maxTranslateY}px)`;
      }
    });
  });
};
