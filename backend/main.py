from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
import sqlalchemy as sa
import os
from dotenv import load_dotenv
from database.database import engine, Base

load_dotenv()

from models.user_model import User
from models.bike_model import Bike
from models.booking_model import Booking

from routes.auth_routes import router as auth_router
from routes.bike_routes import router as bike_router
from routes.booking_routes import router as booking_router
from routes.dashboard_routes import router as dashboard_router
from routes.payment_routes import router as payment_router

app = FastAPI()


def ensure_users_table_columns():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = inspector.get_columns("users")
    existing_columns = {column["name"] for column in columns}
    required_columns = {
        "aadhaar_number": "ALTER TABLE users ADD COLUMN aadhaar_number VARCHAR",
        "address": "ALTER TABLE users ADD COLUMN address VARCHAR",
        "profile_photo": "ALTER TABLE users ADD COLUMN profile_photo VARCHAR",
        "pan_card": "ALTER TABLE users ADD COLUMN pan_card VARCHAR",
        "aadhaar_doc": "ALTER TABLE users ADD COLUMN aadhaar_doc VARCHAR",
        "phone": "ALTER TABLE users ADD COLUMN phone VARCHAR",
        "is_verified": "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE",
        "admin_verified": "ALTER TABLE users ADD COLUMN admin_verified BOOLEAN DEFAULT FALSE",
    }

    with engine.begin() as conn:
        for column_name, ddl in required_columns.items():
            if column_name not in existing_columns:
                conn.execute(text(ddl))

        if "is_verified" in existing_columns:
            for column in columns:
                if column["name"] == "is_verified" and not isinstance(column["type"], sa.Boolean):
                    conn.execute(text(
                        """
                        ALTER TABLE users
                        ALTER COLUMN is_verified TYPE BOOLEAN
                        USING CASE
                            WHEN is_verified IS NULL THEN FALSE
                            WHEN is_verified::TEXT IN ('1', 'true', 't', 'yes') THEN TRUE
                            ELSE FALSE
                        END
                        """
                    ))
                    break

        if "admin_verified" in existing_columns:
            for column in columns:
                if column["name"] == "admin_verified" and not isinstance(column["type"], sa.Boolean):
                    conn.execute(text(
                        """
                        ALTER TABLE users
                        ALTER COLUMN admin_verified TYPE BOOLEAN
                        USING CASE
                            WHEN admin_verified IS NULL THEN FALSE
                            WHEN admin_verified::TEXT IN ('1', 'true', 't', 'yes') THEN TRUE
                            ELSE FALSE
                        END
                        """
                    ))
                    break

        conn.execute(text("UPDATE users SET is_verified = FALSE WHERE is_verified IS NULL"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN is_verified SET DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN is_verified SET NOT NULL"))
        conn.execute(text("UPDATE users SET admin_verified = FALSE WHERE admin_verified IS NULL"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN admin_verified SET DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN admin_verified SET NOT NULL"))

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
ensure_users_table_columns()

# Create uploads dir if it doesn't exist
if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router)
app.include_router(bike_router)
app.include_router(booking_router)
app.include_router(dashboard_router)
app.include_router(payment_router)

@app.get("/")
def home():
    return {
        "message": "Bike Rental API Running"
    }
