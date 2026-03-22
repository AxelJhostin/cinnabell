from decimal import Decimal

from app.core.database import SessionLocal
from app.models.product import Product, ProductCategory

products_data = [
    {
        "name": "Clasico",
        "slug": "clasico",
        "description": "El rol de canela original, suave y esponjoso con glase clasico",
        "price": Decimal("1.00"),
        "category": ProductCategory.individual,
    },
    {
        "name": "Oreo",
        "slug": "oreo",
        "description": "Rol de canela con trocitos de Oreo y crema especial",
        "price": Decimal("1.50"),
        "category": ProductCategory.individual,
    },
    {
        "name": "Pistacho",
        "slug": "pistacho",
        "description": "Rol de canela con glase de pistacho, cremoso e irresistible",
        "price": Decimal("1.50"),
        "category": ProductCategory.individual,
    },
    {
        "name": "Manjar y Nueces",
        "slug": "manjar-y-nueces",
        "description": "Rol de canela banado en manjar con nueces crujientes",
        "price": Decimal("1.50"),
        "category": ProductCategory.individual,
    },
    {
        "name": "Choco Avellana",
        "slug": "choco-avellana",
        "description": "Rol de canela con glase de chocolate y avellana",
        "price": Decimal("1.50"),
        "category": ProductCategory.individual,
    },
    {
        "name": "Frutos Rojos",
        "slug": "frutos-rojos",
        "description": "Rol de canela con coulis de frutos rojos frescos",
        "price": Decimal("1.50"),
        "category": ProductCategory.individual,
    },
    {
        "name": "Creme Brulee",
        "slug": "creme-brulee",
        "description": "Version especial con toque caramelizado estilo creme brulee",
        "price": Decimal("2.00"),
        "category": ProductCategory.especial,
    },
    {
        "name": "Pizza",
        "slug": "pizza",
        "description": "Version especial estilo pizza dulce, la sorpresa de la carta",
        "price": Decimal("2.00"),
        "category": ProductCategory.especial,
    },
    {
        "name": "Box Miti-Miti x4",
        "slug": "box-miti-miti-x4",
        "description": "Caja de 4 roles: mitad clasicos y mitad premium variados",
        "price": Decimal("5.00"),
        "category": ProductCategory.box,
    },
    {
        "name": "Box Miti-Miti x6",
        "slug": "box-miti-miti-x6",
        "description": "Caja de 6 roles: mitad clasicos y mitad premium variados",
        "price": Decimal("7.50"),
        "category": ProductCategory.box,
    },
    {
        "name": "Box Premium x4",
        "slug": "box-premium-x4",
        "description": "Caja de 4 roles todos de sabores premium variados",
        "price": Decimal("6.00"),
        "category": ProductCategory.box,
    },
    {
        "name": "Box Premium x6",
        "slug": "box-premium-x6",
        "description": "Caja de 6 roles todos de sabores premium variados",
        "price": Decimal("9.00"),
        "category": ProductCategory.box,
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.query(Product).first()
        if existing:
            print("Ya hay productos en la base de datos, seed omitido.")
            return

        for data in products_data:
            db.add(Product(**data))

        db.commit()
        print(f"[OK] {len(products_data)} productos de Cinnabell cargados correctamente.")
    except Exception as error:
        db.rollback()
        print(f"[ERROR] Error en seed: {error}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
