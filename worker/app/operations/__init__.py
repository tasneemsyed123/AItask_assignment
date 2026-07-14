"""
Operation registry. Each operation module exposes:
  - run(chunk: str) -> partial result for one chunk of input
  - combine(parts: list) -> the full result, assembled from every chunk's
    partial result in original chunk order
Adding a new operation type = add a module here + one line in the OPERATIONS
dict. This is the Open/Closed Principle in practice: extending supported
operations never requires modifying queue_consumer.py.
"""
from . import uppercase, lowercase, reverse, word_count

OPERATIONS = {
    "UPPERCASE": uppercase,
    "LOWERCASE": lowercase,
    "REVERSE": reverse,
    "WORD_COUNT": word_count,
}
