"""
app/chunking.py
------------------------------------------------------------------------------
Splits input text into ~CHUNK_SIZE-character pieces for progress reporting.
Boundaries only ever fall on whitespace (never mid-word), so operations like
WORD_COUNT can sum per-chunk results without a word straddling two chunks
being counted wrong. Chunks always concatenate back to the exact original
text (no characters dropped or added at the boundaries).
"""

CHUNK_SIZE = 60


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE) -> list[str]:
    if not text:
        return []

    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + chunk_size, n)
        if end < n:
            while end < n and not text[end].isspace():
                end += 1
            if end < n:
                end += 1  # fold the boundary whitespace into this chunk
        chunks.append(text[start:end])
        start = end
    return chunks
