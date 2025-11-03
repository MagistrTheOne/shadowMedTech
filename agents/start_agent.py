#!/usr/bin/env python3
"""
Helper script to start agent for a specific visit.
Used by Next.js API to launch agent processes.
"""

import sys
import os
import json
import asyncio
from livekit.agents import cli
from doctor_agent import entrypoint
from livekit.agents import WorkerOptions

if __name__ == "__main__":
    # Parse command line arguments
    if len(sys.argv) < 3:
        print("Usage: python start_agent.py <visit_id> <room_name>")
        sys.exit(1)
    
    visit_id = sys.argv[1]
    room_name = sys.argv[2]
    doctor_name = sys.argv[3] if len(sys.argv) > 3 else "Доктор"
    
    # Set metadata for job
    os.environ["VISIT_ID"] = visit_id
    os.environ["ROOM_NAME"] = room_name
    os.environ["DOCTOR_NAME"] = doctor_name
    
    # Run agent with specific job metadata
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            # Prefer to run in-process for development
            # In production, use separate worker processes
        )
    )

