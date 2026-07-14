"""Returns the total number of words in the input text."""

def run(input_text: str) -> int:
    return len(input_text.split())


def combine(parts: list) -> int:
    return sum(parts)
