"""
app/main.py
------------------------------------------------------------------------------
Entry point: `python -m app.main` (run from the worker/ directory).
Scaling: to run multiple worker replicas, just start this process multiple
times (e.g. `python -m app.main &` several times, or N pods in Phase 2's
Kubernetes deployment) - see queue_consumer.py's docstring for why this is
safe.
"""
from .queue_consumer import run_forever

if __name__ == "__main__":
    run_forever()
