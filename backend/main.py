from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import Base, engine, get_db


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VetCare API",
    description="REST API aplikacji VetCare",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["System"])
def home():
    return {
        "application": "VetCare API",
        "status": "running",
    }


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
    }


@app.post(
    "/auth/register",
    response_model=schemas.UserRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    email = user_data.email.lower()

    existing_user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Konto z tym adresem e-mail już istnieje",
        )

    user = models.User(
        email=email,
        password_hash=auth.hash_password(user_data.password),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@app.post(
    "/auth/login",
    response_model=schemas.Token,
    tags=["Authentication"],
)
def login(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(models.User)
        .filter(models.User.email == login_data.email.lower())
        .first()
    )

    if user is None or not auth.verify_password(
        login_data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowy e-mail lub hasło",
        )

    token = auth.create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@app.get(
    "/users/me",
    response_model=schemas.UserRead,
    tags=["Users"],
)
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
):
    return current_user


@app.get(
    "/pets",
    response_model=list[schemas.PetRead],
    tags=["Pets"],
)
def get_pets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Pet)
        .filter(models.Pet.owner_id == current_user.id)
        .order_by(models.Pet.created_at.desc())
        .all()
    )


@app.post(
    "/pets",
    response_model=schemas.PetRead,
    status_code=status.HTTP_201_CREATED,
    tags=["Pets"],
)
def create_pet(
    pet_data: schemas.PetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    pet = models.Pet(
        **pet_data.model_dump(),
        owner_id=current_user.id,
    )

    db.add(pet)
    db.commit()
    db.refresh(pet)

    return pet


@app.get(
    "/pets/{pet_id}",
    response_model=schemas.PetRead,
    tags=["Pets"],
)
def get_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    pet = (
        db.query(models.Pet)
        .filter(
            models.Pet.id == pet_id,
            models.Pet.owner_id == current_user.id,
        )
        .first()
    )

    if pet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono zwierzęcia",
        )

    return pet


@app.put(
    "/pets/{pet_id}",
    response_model=schemas.PetRead,
    tags=["Pets"],
)
def update_pet(
    pet_id: int,
    pet_data: schemas.PetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    pet = (
        db.query(models.Pet)
        .filter(
            models.Pet.id == pet_id,
            models.Pet.owner_id == current_user.id,
        )
        .first()
    )

    if pet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono zwierzęcia",
        )

    update_data = pet_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(pet, field, value)

    db.commit()
    db.refresh(pet)

    return pet


@app.delete(
    "/pets/{pet_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Pets"],
)
def delete_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    pet = (
        db.query(models.Pet)
        .filter(
            models.Pet.id == pet_id,
            models.Pet.owner_id == current_user.id,
        )
        .first()
    )

    if pet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nie znaleziono zwierzęcia",
        )

    db.delete(pet)
    db.commit()

    return None