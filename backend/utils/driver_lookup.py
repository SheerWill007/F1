import pandas as pd


def build_driver_name_lookup(laps: pd.DataFrame) -> dict:
    lookup = {}
    for drv in laps["Driver"].unique().tolist():
        drv_laps = laps[laps["Driver"] == drv]
        resolved = drv
        for col in ["FullName", "BroadcastName", "Driver"]:
            if col in drv_laps.columns:
                val = str(drv_laps[col].iloc[0])
                if val and val not in ["nan", "None", ""]:
                    resolved = val
                    break
        lookup[drv] = resolved
    return lookup
