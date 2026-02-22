import pandas as pd

df = pd.read_csv("backup_final_results_tickets_with_assigned_offices.csv")

prev_len = len(df)
df = df.dropna().drop_duplicates()
print(prev_len - len(df))
df.to_csv("backup_final_results_tickets_with_assigned_offices.csv", index=False)