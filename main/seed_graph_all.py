import sqlite3
import datetime
import json
import math

conn = sqlite3.connect("data.db")
cursor = conn.cursor()

users = cursor.execute("SELECT id FROM users").fetchall()

for user in users:
    user_id = user[0]
    cursor.execute("DELETE FROM mastery_snapshots WHERE user_id = ?", (user_id,))
    
    base_date = datetime.datetime.now() - datetime.timedelta(days=30)
    for i in range(31):
        date = base_date + datetime.timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d %H:%M:%S")
        
        progress = i / 30.0
        mastery = 0.2 + (0.6 * progress) + (math.sin(i * 0.5) * 0.08)
        mastery = max(0.0, min(1.0, mastery))
        
        cursor.execute(
            "INSERT INTO mastery_snapshots (user_id, mastery_h, heatmap, created_at) VALUES (?, ?, ?, ?)",
            (user_id, mastery, json.dumps({}), date_str)
        )

conn.commit()
conn.close()
print("Seeded database for ALL users!")
