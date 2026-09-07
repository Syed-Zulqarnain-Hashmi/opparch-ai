import asyncio
from app.database.session import AsyncSessionLocal
from app.database.models import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Check if admin exists by email
        stmt = select(User).where(User.email == "admin@opparch.ai")
        user = (await db.execute(stmt)).scalars().first()
        
        if not user:
            user = User(
                email="admin@opparch.ai",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role="ADMIN",
                is_active=True
            )
            db.add(user)
            print(">>> SUCCESS: New Admin created!")
        else:
            user.hashed_password = get_password_hash("admin123")
            user.role = "ADMIN"
            user.is_active = True
            print(">>> SUCCESS: Existing Admin updated!")
            
        await db.commit()
        print("---------------------------------------")
        print("Login with these credentials:")
        print("Email:    admin@opparch.ai")
        print("Password: admin123")
        print("---------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())