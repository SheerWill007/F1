import numpy as np
import pandas as pd


def safe_val(val):
    if val is None:
        return None
    if isinstance(val, float) and np.isnan(val):
        return None
    if isinstance(val, (np.integer,)):
        return int(val)
    if isinstance(val, (np.floating,)):
        return float(val)
    if isinstance(val, pd.Timestamp):
        return str(val)
    if hasattr(val, "item"):
        return val.item()
    return val


def safe_timedelta(val):
    try:
        if val is None:
            return None
        if pd.isna(val):
            return None
        return str(val)
    except (TypeError, ValueError):
        return None
