import sqlite3
import os
import bcrypt
from datetime import datetime, timedelta
import random

def seed_database():
    db_path = os.path.join(os.path.dirname(__file__), "..", "database.sqlite")
    db_path = os.path.abspath(db_path)
    
    print(f"Using database at: {db_path}")
    if not os.path.exists(db_path):
        print("Database not found!")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Seed users
        print("Seeding users...")
        users = []
        for i in range(1, 11):
            email = f"user{i}@test.com"
            password = "User123!"
            hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            name = f"Test User {i}"
            roles = "process_leader" if i % 2 == 0 else "user"
            
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            existing = cursor.fetchone()
            if not existing:
                cursor.execute(
                    "INSERT INTO users (name, email, password, roles) VALUES (?, ?, ?, ?)",
                    (name, email, hashed_password, roles)
                )
                users.append(cursor.lastrowid)
            else:
                users.append(existing[0])

        # Get the first admin user
        cursor.execute("SELECT id FROM users LIMIT 1")
        admin_id = cursor.fetchone()[0]

        # Seed processes
        print("Seeding processes...")
        processes = []
        for i in range(1, 11):
            name = f"Process {i}"
            description = f"Description for test process {i}"
            leader_id = random.choice(users)
            owner = f"Owner {i}"
            priority = random.choice(["low", "medium", "high"])
            department = f"Department {i % 3 + 1}"
            
            cursor.execute(
                "INSERT INTO processes (name, description, created_by, status, owner, leader_id, priority, departmentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (name, description, admin_id, "active", owner, leader_id, priority, department)
            )
            processes.append(cursor.lastrowid)

        # Seed process_leaders
        print("Seeding process_leaders...")
        for i in range(1, 11):
            process_id = random.choice(processes)
            leader_id = random.choice(users)
            try:
                cursor.execute(
                    "INSERT INTO process_leaders (process_id, leader_id, created_by) VALUES (?, ?, ?)",
                    (process_id, leader_id, admin_id)
                )
            except sqlite3.IntegrityError:
                # ignore duplicates (UNIQUE constraint)
                pass

        # Seed process_comments
        print("Seeding process_comments...")
        for i in range(1, 11):
            process_id = random.choice(processes)
            user_id = random.choice(users)
            comment = f"Test comment {i} on process {process_id}"
            cursor.execute(
                "INSERT INTO process_comments (process_id, user_id, comment) VALUES (?, ?, ?)",
                (process_id, user_id, comment)
            )

        # Seed actions
        print("Seeding actions...")
        actions = []
        for i in range(1, 11):
            name = f"Action {i}"
            process_id = random.choice(processes)
            leader_id = random.choice(users)
            what = f"What {i}"
            why = f"Why {i}"
            how = f"How {i}"
            
            cursor.execute(
                "INSERT INTO actions (name, process_id, leader_id, what, why, how, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (name, process_id, leader_id, what, why, how, "pending", admin_id)
            )
            actions.append(cursor.lastrowid)

        # Seed action_comments
        print("Seeding action_comments...")
        for i in range(1, 11):
            action_id = random.choice(actions)
            user_id = random.choice(users)
            comment = f"Test comment {i} on action {action_id}"
            cursor.execute(
                "INSERT INTO action_comments (action_id, user_id, comment) VALUES (?, ?, ?)",
                (action_id, user_id, comment)
            )

        # Seed action_resources
        print("Seeding action_resources...")
        for i in range(1, 11):
            action_id = random.choice(actions)
            user_id = random.choice(users)
            filename = f"document_{i}.pdf"
            file_path = f"/uploads/{filename}"
            
            cursor.execute(
                "INSERT INTO action_resources (action_id, filename, file_path, content_type, file_size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
                (action_id, filename, file_path, "application/pdf", 1024 * i, user_id)
            )

        # Seed notifications
        print("Seeding notifications...")
        for i in range(1, 11):
            user_id = random.choice(users)
            title = f"Notification {i}"
            message = f"This is test notification {i}"
            
            cursor.execute(
                "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
                (user_id, title, message)
            )

        # Seed user_deactivation_requests
        print("Seeding user_deactivation_requests...")
        for i in range(1, 11):
            user_id = random.choice(users)
            reason = f"Leaving company {i}"
            
            cursor.execute(
                "INSERT INTO user_deactivation_requests (user_id, reason, status) VALUES (?, ?, ?)",
                (user_id, reason, "pending")
            )

        # Seed audit_reports
        print("Seeding audit_reports...")
        for i in range(1, 11):
            process_id = random.choice(processes)
            auditor_id = random.choice(users)
            title = f"Audit Report {i}"
            content = f"Content for audit report {i}"
            
            cursor.execute(
                "INSERT INTO audit_reports (title, content, process_id, auditor_id, status) VALUES (?, ?, ?, ?, ?)",
                (title, content, process_id, auditor_id, "draft")
            )

        # Seed opportunities
        print("Seeding opportunities...")
        for i in range(1, 11):
            process_id = random.choice(processes)
            name = f"Opportunity {i}"
            description = f"Description for opportunity {i}"
            
            cursor.execute(
                "INSERT INTO opportunities (process_id, name, description, created_by) VALUES (?, ?, ?, ?)",
                (process_id, name, description, admin_id)
            )

        conn.commit()
        print("Successfully inserted 10 test records into each table!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error seeding database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    seed_database()
