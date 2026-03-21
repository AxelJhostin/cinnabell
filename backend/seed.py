from app.core.database import SessionLocal
from app.models.product import Product, ProductFlavor, ProductCategory

products_data = [
    {"name": "Clásico", "slug": "clasico", "description": "El rol de canela original, suave y esponjoso con glasé clásico", "price": 1.00, "category": ProductCategory.individual},
    {"name": "Oreo", "slug": "oreo", "description": "Rol de canela con trocitos de Oreo y crema especial", "price": 1.50, "category": ProductCategory.individual},
    {"name": "Pistacho", "slug": "pistacho", "description": "Rol de canela con glasé de pistacho, cremoso e irresistible", "price": 1.50, "category": ProductCategory.individual},
    {"name": "Manjar y Nueces", "slug": "manjar-y-nueces", "description": "Rol de canela bañado en manjar con nueces crujientes", "price": 1.50, "category": ProductCategory.individual},
    {"name": "Choco Avellana", "slug": "choco-avellana", "description": "Rol de canela con glasé de chocolate y avellana", "price": 1.50, "category": ProductCategory.individual},
    {"name": "Frutos Rojos", "slug": "frutos-rojos", "description": "Rol de canela con coulis de frutos rojos frescos", "price": 1.50, "category": ProductCategory.individual},
    {"name": "Creme Brulee", "slug": "creme-brulee", "description": "Versión especial con toque caramelizado estilo creme brulee", "price": 2.00, "category": ProductCategory.especial},
    {"name": "Pizza", "slug": "pizza", "description": "Versión especial estilo pizza dulce — la sorpresa de la carta", "price": 2.00, "category": ProductCategory.especial},
    {"name": "Box Miti-Miti x4", "slug": "box-miti-miti-x4", "description": "Caja de 4 roles: mitad clásicos y mitad premium variados", "price": 5.00, "category": ProductCategory.box},
    {"name": "Box Miti-Miti x6", "slug": "box-miti-miti-x6", "description": "Caja de 6 roles: mitad clásicos y mitad premium variados", "price": 7.50, "category": ProductCategory.box},
    {"name": "Box Premium x4", "slug": "box-premium-x4", "description": "Caja de 4 roles todos de sabores premium variados", "price": 6.00, "category": ProductCategory.box},
    {"name": "Box Premium x6", "slug": "box-premium-x6", "description": "Caja de 6 roles todos de sabores premium variados", "price": 9.00, "category": ProductCategory.box},
]

def seed():
    db = SessionLocal()
    try:
        existing = db.query(Product).first()
        if existing:
            print("Ya hay productos en la base de datos, seed omitido.")
            return

        for data in products_data:
            product = Product(**data)
            db.add(product)

        db.commit()
        print(f"✅ {len(products_data)} productos de Cinnabell cargados correctamente.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error en seed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()