import os
import logging
import fastf1


def configure_logging():
    logging.basicConfig(level=logging.INFO)
    logging.getLogger("fastf1").propagate = False
    fastf1.set_log_level(os.getenv("FASTF1_LOG_LEVEL", "WARNING"))
