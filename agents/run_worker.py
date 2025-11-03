#!/usr/bin/env python3
"""
Run agent as a worker that receives dispatch requests from LiveKit.
For production deployment.
"""

import os
from dotenv import load_dotenv
from doctor_agent import entrypoint
from livekit.agents import cli, WorkerOptions

load_dotenv()

if __name__ == "__main__":
    # Run as a worker that receives job dispatches
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            # Worker will automatically receive dispatch requests for rooms
            # when participants join
        )
    )

