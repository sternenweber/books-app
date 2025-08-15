from loguru import logger
import sys

def setup_logging(level: str = "info"):
    logger.remove()
    logger.add(sys.stdout, level=level.upper(), enqueue=True, backtrace=False, diagnose=False)
    return logger
