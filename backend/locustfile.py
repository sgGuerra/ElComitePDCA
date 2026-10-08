from locust import HttpUser, task, between

class ElComiteUser(HttpUser):
    """
    Virtual user for El Comité PDCA.
    Simulates user behavior targeting the FastAPI backend.
    """
    
    # Wait time between consecutive tasks (1 to 5 seconds)
    wait_time = between(1, 5)

    def on_start(self):
        """
        Executed when a virtual user starts.
        Authenticates against the API to get a JWT token.
        """
        # Authentication typically expects form data in FastAPI's OAuth2PasswordRequestForm
        response = self.client.post(
            "/api/auth/login",
            data={
                "username": "admin@elcomite.org",
                "password": "Admin123!"
            }
        )
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            # Update default session headers so all subsequent requests carry the token
            self.client.headers.update({"Authorization": f"Bearer {token}"})
        else:
            print(f"Authentication failed: {response.status_code} - {response.text}")

    @task(4)
    def get_dashboard(self):
        """Simulate viewing the main dashboard."""
        with self.client.get("/api/statistics/dashboard", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get dashboard: {response.status_code}")

    @task(3)
    def list_processes(self):
        """Simulate listing processes."""
        with self.client.get("/api/processes/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get processes: {response.status_code}")

    @task(2)
    def list_users(self):
        """Simulate checking the user directory."""
        with self.client.get("/api/users/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get users: {response.status_code}")

    @task(2)
    def check_notifications(self):
        """Simulate checking active notifications."""
        with self.client.get("/api/notifications/", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to get notifications: {response.status_code}")
