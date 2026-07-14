"""Reverses the input string."""

def run(input_text: str) -> str:
    return input_text[::-1]


def combine(parts: list) -> str:
    # Each part is already the reverse of its own chunk; reversing the whole
    # text means the chunks themselves must also come back in reverse order
    # (reverse("ab" + "cd") == reverse("cd") + reverse("ab")).
    return "".join(reversed(parts))
