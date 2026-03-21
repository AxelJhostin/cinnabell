from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product import ProductDetailResponse, ProductListResponse

router = APIRouter()


@router.get("", response_model=list[ProductListResponse])
def list_products(db: Session = Depends(get_db)) -> list[ProductListResponse]:
    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.id.asc())
        .all()
    )
    return products


@router.get("/{slug}", response_model=ProductDetailResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)) -> ProductDetailResponse:
    product = (
        db.query(Product)
        .options(selectinload(Product.flavors))
        .filter(Product.slug == slug, Product.is_active.is_(True))
        .first()
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product
