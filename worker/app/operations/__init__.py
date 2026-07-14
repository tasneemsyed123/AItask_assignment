"""
Operation registry. Each operation is a pure function: (input_text: str) -> result.
Adding a new operation type = add a module here + one line in the OPERATIONS dict.
This is the Open/Closed Principle in practice: extending supported operations
never requires modifying queue_consumer.py.
"""
from .uppercase import run as uppercase
from .lowercase import run as lowercase
from .reverse import run as reverse
from .word_count import run as word_count

OPERATIONS = {
    "UPPERCASE": uppercase,
    "LOWERCASE": lowercase,
    "REVERSE": reverse,
    "WORD_COUNT": word_count,
}
