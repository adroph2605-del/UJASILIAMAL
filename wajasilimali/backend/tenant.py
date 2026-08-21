from typing import Optional
from fastapi import HTTPException, status, Header, Query
import models


def require_business(user: models.User) -> int:
    """Hakikisha user ana biashara; rudisha business_id."""
    if not user.business_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Akaunti haina biashara. Jisajili upya au wasiliana na admin.",
        )
    return user.business_id


def parse_branch_id(
    x_branch_id: Optional[str] = Header(None, alias="X-Branch-Id"),
    branch_id: Optional[int] = Query(None),
) -> Optional[int]:
    """Soma branch kutoka header au query."""
    if branch_id is not None:
        return branch_id
    if x_branch_id is not None and str(x_branch_id).strip() != "":
        try:
            return int(x_branch_id)
        except ValueError:
            return None
    return None
