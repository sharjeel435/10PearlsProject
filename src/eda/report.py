from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns


def create_eda(frame, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    frame = frame.copy()
    frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True)
    plots = [("us_aqi", "AQI distribution"), ("pm2_5", "PM2.5 distribution"), ("pm10", "PM10 distribution")]
    for column, title in plots:
        if column in frame:
            sns.histplot(data=frame, x=column, hue="city", element="step"); plt.title(title)
            plt.tight_layout(); plt.savefig(output_dir / f"{column}_distribution.png"); plt.close()
    numeric = frame.select_dtypes("number")
    sns.heatmap(numeric.corr().loc[["us_aqi"], :], cmap="coolwarm", center=0)
    plt.tight_layout(); plt.savefig(output_dir / "aqi_correlations.png"); plt.close()
    for period, values in (
        ("hour", frame["timestamp"].dt.hour),
        ("month", frame["timestamp"].dt.month),
        ("season", frame["timestamp"].dt.month.map({12: "winter", 1: "winter", 2: "winter",
                                                     3: "spring", 4: "spring", 5: "spring",
                                                     6: "summer", 7: "summer", 8: "summer",
                                                     9: "autumn", 10: "autumn", 11: "autumn"})),
    ):
        plot_frame = frame.assign(period=values).groupby(["city", "period"], as_index=False)["us_aqi"].mean()
        sns.lineplot(data=plot_frame, x="period", y="us_aqi", hue="city", marker="o")
        plt.title(f"Mean AQI by {period}"); plt.tight_layout()
        plt.savefig(output_dir / f"aqi_by_{period}.png"); plt.close()
    pollutants = [column for column in ("pm2_5", "pm10", "carbon_monoxide", "nitrogen_dioxide",
                                         "sulphur_dioxide", "ozone") if column in frame]
    frame.groupby("city")[pollutants].mean().to_csv(output_dir / "pollutants_by_city.csv")
    frame.groupby("city")["us_aqi"].describe().to_csv(output_dir / "aqi_by_city.csv")
    frame.isna().mean().sort_values(ascending=False).to_csv(output_dir / "missing_values.csv")
