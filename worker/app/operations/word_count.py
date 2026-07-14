"""Returns the total number of words and letters in the input text."""

def run(input_text: str) -> dict:
    return {
        "words": len(input_text.split()),
        "letters": sum(1 for ch in input_text if ch.isalpha()),
    }


def combine(parts: list) -> str:
    words = sum(p["words"] for p in parts)
    letters = sum(p["letters"] for p in parts)
    return f"words {words} letters {letters}"
