import React from 'react';
import FlipbookReader from './FlipbookReader';

export default function FullScreenPdfViewerModal({
  book,
  isOpen,
  onClose,
  currentUser
}) {
  return (
    <FlipbookReader
      book={book}
      isOpen={isOpen}
      onClose={onClose}
      currentUser={currentUser}
    />
  );
}
